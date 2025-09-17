import { Component, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  http = inject(HttpClient);
  trackUrl = '';
  isLoading = false;
  error = '';

  download() {
    if (!this.trackUrl) {
      this.error = 'Please enter a SoundCloud URL.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.http.post('http://localhost:3000/download', { url: this.trackUrl }, { responseType: 'blob', observe: 'response' })
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          const disposition = response.headers.get('Content-Disposition');
          let filename = 'track.mp3'; // Default filename
          if (disposition) {
            const filenameRegex = /filename="([^"]+)"/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
              filename = decodeURI(matches[1]);
            }
          }

          if (response.body) {
            saveAs(response.body, filename);
          }

          this.isLoading = false;
          this.trackUrl = ''; // Limpia el campo de texto
        },
        error: (err) => {
          console.error(err);
          this.error = 'Failed to download track. Check the URL or try again later.';
          this.isLoading = false;
        }
      });
  }
}
