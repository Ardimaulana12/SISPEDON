from flask import Flask, request,Blueprint, render_template
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask_cors import CORS


form_bp = Blueprint('form_bp', __name__)
    
# Email configuration for sending emails using email address
SMTP_SERVER = 'mail.taru.asia'  # SMTP server (e.g., for Gmail)
SMTP_PORT = 587
EMAIL_USER = 'contact@taru.asia'  # email address for sending feedback
EMAIL_PASSWORD = 'P4dicekcek'  # app password or regular email password
TO_EMAIL = 'contact@taru.asia'  # own email to receive the feedback

@form_bp.route('/send', methods=['POST'])
def send_email():
    # Get the form data from the React front-end
    data = request.get_json()
    nama = data['nama']
    email = data['email']
    pesan = data['pesan']

    # Create the email message
    msg = MIMEMultipart()
    msg['From'] = EMAIL_USER
    msg['To'] =" ".join(TO_EMAIL)
    msg['Subject'] = f"Feedback from {nama}"

    # Email body content
    body = f"Nama: {nama}\nEmail: {email}\nPesan:\n{pesan}"
    msg.attach(MIMEText(body, 'plain'))

    # Send the email via SMTP
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Secure the connection
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        print("SMTP connection successful!")
        server.sendmail(EMAIL_USER, TO_EMAIL, msg.as_string())
        server.quit()

        return "Feedback berhasil dikirim!", 200
    except Exception as e:
        print(f"SMTP connection failed: {e}")
        return f"Error: {str(e)}", 500


# if __name__ == '__main__':
#     app.run(debug=True)
