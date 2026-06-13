@echo off
echo ================================
echo   Personal Chatbot Setup
echo ================================
echo.

echo [1/3] Installing Python dependencies...
pip install -r requirements.txt
echo.

echo [2/3] Checking Ollama...
ollama --version 2>nul
if %errorlevel% neq 0 (
    echo Ollama not found! Install it from: https://ollama.com
    echo Then run: ollama pull llama3
    echo.
    pause
    exit /b 1
)

echo [3/3] Pulling llama3 model (this may take a while)...
ollama pull llama3

echo.
echo ================================
echo   Setup complete!
echo   Run: python app.py
echo   Then open: http://localhost:8000
echo ================================
pause
