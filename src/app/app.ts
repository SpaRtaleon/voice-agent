import { CommonModule, NgFor } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UltravoxSession } from 'ultravox-client';
import { Service } from './service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App   {
  session: UltravoxSession | null = null;
  isConnected = false;
  isConnecting = false;
  status = 'Not started';
  transcripts: Array<{ speaker: 'user' | 'agent', text: string }> = [];
  errorMessage = '';

  constructor(private service: Service) {}

  async startCall() {
    try {
      this.isConnecting = true;
      this.status = 'Creating call session...';
      this.errorMessage = '';

      await navigator.mediaDevices.getUserMedia({ audio: true });

      const joinUrl = await this.service.createCall();
      this.status = 'Connecting to voice agent...';

      this.session = new UltravoxSession();

      // ✅ Properly handle all connection states
      this.session.addEventListener('status', (event: any) => {
        console.log('Ultravox status:', event.state);

        if (['connected', 'idle', 'ready'].includes(event.state)) {
          this.isConnected = true;
          this.isConnecting = false;
          this.status = 'Connected - Speak now!';
        } else if (event.state === 'connecting') {
          this.isConnecting = true;
          this.isConnected = false;
          this.status = 'Connecting...';
        } else if (event.state === 'disconnected' || event.state === 'closed') {
          this.isConnected = false;
          this.isConnecting = false;
          this.status = 'Disconnected';
        } else if (event.state === 'error') {
          this.isConnected = false;
          this.isConnecting = false;
          this.status = 'Error';
        } else {
          this.status = event.state;
        }
      });

      // ✅ Handle transcripts
      this.session.addEventListener('transcripts', (event: any) => {
        console.log('Transcript:', event);
        if (event.text && event.text.trim()) {
          this.transcripts.push({
            speaker: event.speaker === 'user' ? 'user' : 'agent',
            text: event.text
          });
        }
      });

      // ✅ Handle errors
      this.session.addEventListener('error', (event: any) => {
        console.error('Ultravox error:', event);
        this.errorMessage = event.message || 'Connection error occurred';
        this.status = 'Error';
        this.isConnecting = false;
        this.isConnected = false;
      });

      await this.session.joinCall(joinUrl);
    } catch (error: any) {
      console.error('Failed to start call:', error);
      this.errorMessage = error.message || 'Failed to connect';
      this.status = 'Failed';
      this.isConnecting = false;
      this.isConnected = false;
    }
  }

  async endCall() {
    if (this.session) {
      await this.session.leaveCall();
      this.session = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.status = 'Disconnected';
    }
  }

}
