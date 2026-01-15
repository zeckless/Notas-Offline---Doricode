# Script para configurar GPG y Git
Write-Host "=== Configurando GPG y Git para Doricode ===" -ForegroundColor Green

# 1. Importar llave publica de Doricode
Write-Host "`n1. Importando llave publica de Doricode..." -ForegroundColor Yellow
gpg --import Doricode-public-key.asc

# 2. Generar par de llaves GPG
Write-Host "`n2. Generando tus llaves GPG..." -ForegroundColor Yellow
Write-Host "IMPORTANTE: Cuando te pregunte, ingresa:" -ForegroundColor Cyan
Write-Host "  - Tipo: 1 (RSA and RSA)" -ForegroundColor Cyan
Write-Host "  - Tamano: 4096" -ForegroundColor Cyan
Write-Host "  - Validez: 0 (no expira)" -ForegroundColor Cyan
Write-Host "  - Nombre: Mario Antonio Opazo Arnaiz" -ForegroundColor Cyan
Write-Host "  - Email: mario.opazo@ug.uchile.cl" -ForegroundColor Cyan
Write-Host "  - Comentario: (presiona Enter, dejalo vacio)" -ForegroundColor Cyan
Write-Host "  - Passphrase: Elige una contrasena segura" -ForegroundColor Cyan

Read-Host "Presiona Enter para continuar"
gpg --full-generate-key

# 3. Obtener Key ID
Write-Host "`n3. Obteniendo tu Key ID..." -ForegroundColor Yellow
$keyOutput = gpg --list-secret-keys --keyid-format=long mario.opazo@ug.uchile.cl
Write-Host $keyOutput

# Extraer Key ID automaticamente
$keyId = ($keyOutput | Select-String -Pattern "rsa4096/([A-F0-9]+)" | ForEach-Object { $_.Matches.Groups[1].Value })

if ($keyId) {
    Write-Host "`nKey ID encontrado: $keyId" -ForegroundColor Green
    
    # 4. Configurar Git
    Write-Host "`n4. Configurando Git..." -ForegroundColor Yellow
    git config --global user.name "Mario Antonio Opazo Arnaiz"
    git config --global user.email "mario.opazo@ug.uchile.cl"
    git config --global user.signingkey $keyId
    git config --global commit.gpgsign true
    git config --global tag.gpgsign true
    
    Write-Host "`nGit configurado correctamente" -ForegroundColor Green
    
    # 5. Exportar llave publica
    Write-Host "`n5. Exportando tu llave publica..." -ForegroundColor Yellow
    gpg --armor --export mario.opazo@ug.uchile.cl > mi-llave-publica.asc
    Write-Host "Llave exportada a: mi-llave-publica.asc" -ForegroundColor Green
    
    Write-Host "`n=== CONFIGURACION COMPLETA ===" -ForegroundColor Green
    Write-Host "`nAhora puedes inicializar Git y hacer commits firmados" -ForegroundColor Cyan
} else {
    Write-Host "`nNo se pudo encontrar el Key ID. Ejecutalo manualmente" -ForegroundColor Red
}
