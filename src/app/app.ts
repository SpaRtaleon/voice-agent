import { CommonModule, NgFor } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UltravoxSession } from 'ultravox-client';

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
  isConfigured = false;
  status = 'Not started';
  transcripts: Array<{ speaker: 'user' | 'agent', text: string }> = [];
  errorMessage = '';
  private api_key = 'MnRnukQ1.CVZ3FUrsEEerwT7r2zvVAK28uChaKxSd';
  private agent_id='75e2aaa3-e4cc-4bf1-b137-0c7268881055'
  // Replace with your Ultravox API key and configuration
  private readonly ULTRAVOX_API_KEY = 'your_ultravox_api_key_here';
  private readonly JOIN_URL = 'your_ultravox_join_url_here';
  async createCall(): Promise<string> {
  const response = await fetch(`https://api.ultravox.ai/api/agents/75e2aaa3-e4cc-4bf1-b137-0c7268881055/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': this.api_key
    },
    body: JSON.stringify({ 
     "metadata": {},
  "medium": {
    "webRtc": {}

  }
})
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create call: ${error}`);
  }

  const data = await response.json();
  console.log('Call Created ✅', data);

  return data.joinUrl; // <-- This is the Ultravox WebRTC join URL
}
   async startCall() {
    try {
      this.isConnecting = true;
      this.status = 'Creating call session...';
      this.errorMessage = '';

      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create call session with Ultravox API
      const joinUrl = await this.createCall();
      
      this.status = 'Connecting to voice agent...';

      // Create Ultravox session
      this.session = new UltravoxSession();

      // Set up event listeners
      this.session.addEventListener('status', (event: any) => {
        console.log('Status:', event.state);
        this.status = event.state;
        
        if (event.state === 'idle') {
          this.isConnected = true;
          this.isConnecting = false;
          this.status = 'Connected - Speak now!';
        } else if (event.state === 'disconnected') {
          this.isConnected = false;
          this.status = 'Disconnected';
        }
      });

      this.session.addEventListener('transcripts', (event: any) => {
        console.log('Transcript:', event);
        if (event.text && event.text.trim()) {
          this.transcripts.push({
            speaker: event.speaker === 'user' ? 'user' : 'agent',
            text: event.text
          });
        }
      });

      this.session.addEventListener('error', (event: any) => {
        console.error('Ultravox error:', event);
        this.errorMessage = event.message || 'Connection error occurred';
        this.status = 'Error';
        this.isConnecting = false;
        this.isConnected = false;
      });

      // Join the call
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
      this.status = 'Disconnected';
    }
  }

}
