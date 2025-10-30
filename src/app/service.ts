import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class Service {
   private apiUrl = 'https://voice-agent-backend-eight.vercel.app'; // Flask backend

  constructor(private http: HttpClient) {}

  async createCall(): Promise<string> {
    try {
      const response: any = await firstValueFrom(
        this.http.post<{ callId: string, joinUrl: string  }>(`${this.apiUrl}/create-call`, {})
      );
      return response.joinUrl;
    } catch (error: any) {
      throw new Error(`Failed to create call: ${error.message}`);
    }
  }
  
}
