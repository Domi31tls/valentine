import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from root .env file
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: resolve(rootDir, '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Service d'email pour les magic links
 */
export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Créer et configurer le transporteur SMTP
   */
  private static createTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '587') === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });
    }
    return this.transporter;
  }

  /**
   * Vérifier la configuration SMTP
   */
  static async verifyConfiguration(): Promise<boolean> {
    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      console.log('✅ SMTP configuration verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP configuration error:', error);
      return false;
    }
  }

  /**
   * Envoyer un magic link par email
   */
  static async sendMagicLink(
    to: string, 
    userName: string, 
    magicLink: string
  ): Promise<boolean> {
    try {
      const transporter = this.createTransporter();
      
      const htmlContent = this.loadEmailTemplate('magic-link.html', {
        userName,
        magicLink,
        email: to
      });
      const textContent = this.loadEmailTemplate('magic-link.txt', {
        userName,
        magicLink,
        email: to
      });

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Portfolio Valentine',
          address: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@valentine-arnaly.com'
        },
        to,
        subject: '🔐 Votre lien de connexion - Portfolio Valentine',
        text: textContent,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Magic link sent successfully:', info.messageId);
      
      // En développement, afficher le lien dans la console
      if (process.env.NODE_ENV === 'development' && process.env.DEV_SHOW_MAGIC_LINKS === 'true') {
        console.log('🔗 Magic link for development:');
        console.log(magicLink);
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to send magic link:', error);
      return false;
    }
  }

  /**
   * Charger un template d'email et remplacer les variables
   */
  private static loadEmailTemplate(templateName: string, variables: Record<string, string>): string {
    try {
      const templatePath = resolve(rootDir, 'frontend', 'templates', 'email', templateName);
      let content = readFileSync(templatePath, 'utf8');
      
      // Remplacer les variables {{variableName}}
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
      }
      
      return content;
    } catch (error) {
      console.error(`❌ Failed to load email template ${templateName}:`, error);
      // Fallback simple si le template n'est pas trouvé
      if (templateName.endsWith('.html')) {
        return `<h1>Magic Link</h1><p>Hello ${variables.userName},</p><p><a href="${variables.magicLink}">Click here to login</a></p>`;
      } else {
        return `Hello ${variables.userName},\n\nClick this link to login: ${variables.magicLink}\n\nBest regards,\nPortfolio Valentine`;
      }
    }
  }

  /**
   * Envoyer un email de notification de connexion
   */
  static async sendLoginNotification(
    to: string, 
    userName: string, 
    loginTime: Date,
    userAgent?: string
  ): Promise<boolean> {
    try {
      const transporter = this.createTransporter();
      
      const htmlContent = this.loadEmailTemplate('login-notification.html', {
        userName,
        email: to,
        loginTime: loginTime.toLocaleString('fr-FR'),
        userAgent: userAgent || 'Inconnu'
      });
      const textContent = this.loadEmailTemplate('login-notification.txt', {
        userName,
        email: to,
        loginTime: loginTime.toLocaleString('fr-FR'),
        userAgent: userAgent || 'Inconnu'
      });

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Portfolio Valentine',
          address: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@valentine-arnaly.com'
        },
        to,
        subject: '✅ Connexion réussie - Portfolio Valentine',
        text: textContent,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Login notification sent:', info.messageId);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to send login notification:', error);
      return false;
    }
  }
}

export default EmailService;
