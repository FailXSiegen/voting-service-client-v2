<?php
namespace Deployer;

require 'recipe/common.php';
require 'recipe/rsync.php';

// Hosts
host('staging')
    ->hostname('oc-vm87.riconnect.de')
    ->user('c123_ssh')
    ->set('deploy_path', '/var/www/clients/client123/web1035/web');

host('prod')
    ->hostname('oc-vm87.riconnect.de')
    ->user('c123_ssh')
    ->set('deploy_path', '/var/www/clients/client123/web1035/web');

// Config
set('shared_files', [
    '.htaccess'
]);

set('rsync_src', './dist/');

set('rsync',[
    'exclude'      => [
        'deploy.php',
        '.editorconfig',
        '.env',
        '.git*',
        'README.md'
    ],
    'exclude-file' => false,
    'include'      => [],
    'include-file' => false,
    'filter'       => [],
    'filter-file'  => false,
    'filter-perdir'=> false,
    'flags'        => 'rz', // Recursive, with compress
    'options'      => ['delete', 'times', 'perms', 'links', 'delete-excluded'],
    'timeout'      => 600,
]);

// Tasks
task('build', function () {
    run('npm --quiet install');
    run('npm --quiet run build');
})->local();


task('deploy', [
    'deploy:prepare',
    'deploy:lock',
    'build',
    'deploy:release',
    'rsync',
    'deploy:shared',
    'deploy:symlink',
    'deploy:unlock',
    'cleanup',
    'success'
])->desc('Deploy Vue App');

// [Optional] if deploy fails automatically unlock.
after('deploy:failed', 'deploy:unlock');
