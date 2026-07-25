from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, static_folder='static', template_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    print("🚀 Starting Deutsch Grammatik Web App...")
    print("📍 Open: http://127.0.0.1:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
