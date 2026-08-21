"""Email service for sending transactional emails via SMTP."""
import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import get_settings
from app.core.logging import get_logger

class EmailService:
    """Sends emails over SMTP. Falls back to logging when SMTP is not configured."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._logger = get_logger(__name__)
        self._configured = bool(self._settings.SMTP_HOST and self._settings.SMTP_FROM_EMAIL)

    def _send(self, to_email: str, subject: str, html_body: str) -> None:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self._settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        msg.set_content("Please view this email in an HTML-capable client.")
        msg.add_alternative(html_body, subtype="html")

        if not self._configured:
            self._logger.warning(
                "smtp_not_configured_email_not_sent",
                to_email=to_email,
                subject=subject,
            )
            return

        context = ssl.create_default_context()
        with smtplib.SMTP(self._settings.SMTP_HOST, self._settings.SMTP_PORT, timeout=10) as server:
            if self._settings.SMTP_USE_TLS:
                server.starttls(context=context)
            if self._settings.SMTP_USERNAME:
                server.login(self._settings.SMTP_USERNAME, self._settings.SMTP_PASSWORD)
            server.send_message(msg)
        self._logger.info("email_sent", to_email=to_email, subject=subject)

    def send_verification_email(self, to_email: str, full_name: str, token: str) -> None:
        """Send an email verification link to the user."""
        verify_url = f"{self._settings.FRONTEND_BASE_URL}/verify-email?token={token}"
        html = f"""
        <html><body>
        <h2>Welcome to Dexter, {full_name}!</h2>
        <p>Please confirm your email address to activate your account:</p>
        <p><a href="{verify_url}">Verify my email</a></p>
        <p>If you did not create an account, you can safely ignore this email.</p>
        </body></html>
        """
        if not self._configured:
            self._logger.info(
                "dev_verification_url",
                verify_url=verify_url,
                hint="SMTP not configured; open this URL or POST the token to /auth/verify-email",
            )
        self._send(to_email, "Verify your Dexter account", html)

    def send_password_reset_email(self, to_email: str, full_name: str, token: str) -> None:
        """Send a password reset link to the user."""
        reset_url = f"{self._settings.FRONTEND_BASE_URL}/reset-password?token={token}"
        html = f"""
        <html><body>
        <h2>Hello {full_name},</h2>
        <p>You requested a password reset for your Dexter account. Click the link below to set a new password:</p>
        <p><a href="{reset_url}">Reset Password</a></p>
        <p>This link will expire in 2 hours. If you did not request this, you can safely ignore this email.</p>
        </body></html>
        """
        if not self._configured:
            self._logger.info(
                "dev_password_reset_url",
                reset_url=reset_url,
                hint="SMTP not configured; open this URL or POST the token to /auth/reset-password",
            )
        self._send(to_email, "Reset your Dexter password", html)

