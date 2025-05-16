from App import create_app
from App.models import db
import os

# Create the Flask application using the factory function
app = create_app()

# Configure upload folder if not already configured
UPLOAD_FOLDER = 'uploads/lecturers'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Initialize database (this will be handled by the app context)
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)