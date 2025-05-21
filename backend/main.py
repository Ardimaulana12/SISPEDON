from flask import Flask, request, jsonify
import numpy as np
from flask_cors import CORS
from App import create_app#, db
from App import models

# Inisialisasi aplikasi Flask dari fungsi create_app
app = create_app()
CORS(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
