import { CommonModule, NgFor } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UltravoxSession,UltravoxSessionStatus } from 'ultravox-client';
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
      
        console.log('Ultravox this.session.status:', this.session.status);

      // ✅ Properly handle all connection states
    this.session.addEventListener('status', () => {
  const state = this.session?.status;
  console.log('Ultravox session status:', state);

  switch (state) {
    case UltravoxSessionStatus.CONNECTING:
      this.isConnecting = true;
      this.isConnected = false;
      this.status = 'Connecting...';
      break;

    case UltravoxSessionStatus.IDLE:
    case UltravoxSessionStatus.LISTENING:
    case UltravoxSessionStatus.THINKING:
    case UltravoxSessionStatus.SPEAKING:
      this.isConnecting = false;
      this.isConnected = true;
      this.status = 'Connected - Speak now!';
      break;

    case UltravoxSessionStatus.DISCONNECTED:
    case UltravoxSessionStatus.DISCONNECTING:
      this.isConnecting = false;
      this.isConnected = false;
      this.status = 'Disconnected';
      break;

    default:
      this.status = state || 'Unknown';
      console.warn('Unhandled Ultravox state:', state);
      break;
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
