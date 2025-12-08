import { Injectable } from '@angular/core';
import { environment } from '../environment';

declare const grecaptcha: any;

@Injectable({
  providedIn: 'root'
})
export class RecaptchaService {
  private siteKey = environment.recaptcha.siteKey;

  constructor() {}

  /**
   * Renderiza el widget de reCAPTCHA v2 en un elemento
   * @param elementId - ID del elemento HTML donde se renderizará
   * @param callback - Función que se ejecuta cuando el usuario resuelve el captcha
   * @returns widgetId para poder resetear después
   */
  renderRecaptcha(elementId: string, callback: (token: string) => void): number | null {
    if (typeof grecaptcha === 'undefined') {
      console.error('❌ reCAPTCHA no está cargado');
      return null;
    }

    try {
      const widgetId = grecaptcha.render(elementId, {
        'sitekey': this.siteKey,
        'callback': callback,
        'expired-callback': () => {
          console.warn('⚠️ reCAPTCHA expiró');
          callback('');
        },
        'error-callback': () => {
          console.error('❌ Error en reCAPTCHA');
          callback('');
        },
        'theme': 'dark' // 'light' o 'dark'
      });

      console.log('✅ reCAPTCHA v2 renderizado, widgetId:', widgetId);
      return widgetId;
    } catch (error) {
      console.error('❌ Error al renderizar reCAPTCHA:', error);
      return null;
    }
  }

  /**
   * Resetea el widget de reCAPTCHA
   * @param widgetId - ID del widget retornado por renderRecaptcha
   */
  resetRecaptcha(widgetId: number | null): void {
    if (widgetId !== null && typeof grecaptcha !== 'undefined') {
      try {
        grecaptcha.reset(widgetId);
        console.log('🔄 reCAPTCHA reseteado');
      } catch (error) {
        console.error('❌ Error al resetear reCAPTCHA:', error);
      }
    }
  }

  /**
   * Obtiene la respuesta del reCAPTCHA
   * @param widgetId - ID del widget
   * @returns Token del reCAPTCHA o null
   */
  getResponse(widgetId: number | null): string | null {
    if (widgetId !== null && typeof grecaptcha !== 'undefined') {
      return grecaptcha.getResponse(widgetId);
    }
    return null;
  }

  /**
   * Verifica si reCAPTCHA está disponible
   */
  isRecaptchaLoaded(): boolean {
    return typeof grecaptcha !== 'undefined' && typeof grecaptcha.render === 'function';
  }

  /**
   * Espera a que reCAPTCHA esté listo
   */
  async waitForRecaptchaLoad(timeout = 10000): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.isRecaptchaLoaded()) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Timeout esperando reCAPTCHA'));
        }
      }, 100);
    });
  }
}