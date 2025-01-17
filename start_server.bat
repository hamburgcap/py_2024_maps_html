@echo off
:: Define o diretório raiz do servidor como o diretório atual
cd %~dp0

:: Define a porta do servidor (altere se desejar usar outra)
set PORT=8000

:: Exibe mensagem informando que o servidor está iniciando
echo Iniciando servidor local na porta %PORT%...
echo Acesse em: http://localhost:%PORT%/

:: Inicia o servidor HTTP com Python
python -m http.server %PORT%

:: Pausa para que o usuário veja mensagens de erro (se houver)
pause
