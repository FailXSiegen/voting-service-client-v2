<?php
namespace Deployer;

require 'recipe/common.php';

// Project name
set('application', 'gitlab-services');

// Kein Git Repository - wir laden die Dateien direkt hoch
set('repository', '');

// Deploy path auf dem Server (Beispiel, per DEPLOY_PATH überschreibbar)
set('deploy_path', getenv('DEPLOY_PATH') ?: '/var/www/html/gitlab-setup');

// Hosts – Zielserver und Benutzer kommen aus der Umgebung, nichts Echtes einchecken.
// Beispiel: DEPLOY_HOST=server.example.com DEPLOY_USER=deploy vendor/bin/dep deploy production
host('production')
    ->set('hostname', getenv('DEPLOY_HOST') ?: 'server.example.com')
    ->set('remote_user', getenv('DEPLOY_USER') ?: 'deploy');

// Tasks
desc('Deploy docker-compose services');
task('deploy', [
    'deploy:setup',
    'deploy:upload',
    'deploy:docker:restart',
]);

// Erstelle Verzeichnisstruktur
task('deploy:setup', function () {
    run('mkdir -p {{deploy_path}}');
});

// Upload der lokalen Dateien
task('deploy:upload', function () {
    // Backup erstellen
    run('cd {{deploy_path}} && cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S) || true');
    
    // docker-compose.yaml hochladen
    upload('./docker-compose.yaml', '{{deploy_path}}/docker-compose.yml');
    
    // mcp-http-wrapper Verzeichnis hochladen
    run('mkdir -p {{deploy_path}}/mcp-http-wrapper');
    upload('./mcp-http-wrapper/', '{{deploy_path}}/mcp-http-wrapper/');
    
    // WICHTIG: .env und andere Dateien bleiben auf dem Server unverändert
    // Die Verzeichnisse backup-scripts/, n8n/, shared/ bleiben ebenfalls unberührt
});

// Docker Container neustarten
task('deploy:docker:restart', function () {
    cd('{{deploy_path}}');
    run('docker-compose down');
    run('docker-compose up -d');
    run('docker ps');
});

// Nur MCP-HTTP-Wrapper aktualisieren und neustarten
desc('Update and restart only MCP-HTTP-Wrapper');
task('deploy:mcp', [
    'deploy:mcp:upload',
    'deploy:mcp:restart',
]);

// Upload nur MCP-HTTP-Wrapper Dateien
task('deploy:mcp:upload', function () {
    writeln('Uploading MCP-HTTP-Wrapper files...');
    run('mkdir -p {{deploy_path}}/mcp-http-wrapper');
    upload('./mcp-http-wrapper/', '{{deploy_path}}/mcp-http-wrapper/');
});

// Nur MCP Container neustarten
task('deploy:mcp:restart', function () {
    cd('{{deploy_path}}');
    writeln('Recreating MCP containers...');
    run('docker-compose stop n8n-mcp-http');
    run('docker-compose build --no-cache n8n-mcp-http');
    run('docker-compose up -d n8n-mcp-http');
    run('docker ps | grep n8n-mcp');
});