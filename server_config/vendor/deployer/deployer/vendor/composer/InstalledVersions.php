<?php

namespace Composer;

use Composer\Semver\VersionParser;

class InstalledVersions
{
    private static $installed =  [
        'root' =>
         [
             'pretty_version' => 'v7.1.2',
             'version' => '7.1.2.0',
             'aliases' =>
              [
              ],
             'reference' => '6b354c2e89198e64a0244fb96cc5604312027800',
             'name' => 'deployer/deployer',
         ],
        'versions' =>
         [
             'deployer/deployer' =>
              [
                  'pretty_version' => 'v7.1.2',
                  'version' => '7.1.2.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '6b354c2e89198e64a0244fb96cc5604312027800',
              ],
             'evenement/evenement' =>
              [
                  'pretty_version' => 'v3.0.1',
                  'version' => '3.0.1.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '531bfb9d15f8aa57454f5f0285b18bec903b8fb7',
              ],
             'fig/http-message-util' =>
              [
                  'pretty_version' => '1.1.5',
                  'version' => '1.1.5.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '9d94dc0154230ac39e5bf89398b324a86f63f765',
              ],
             'justinrainbow/json-schema' =>
              [
                  'pretty_version' => '5.2.11',
                  'version' => '5.2.11.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '2ab6744b7296ded80f8cc4f9509abbff393399aa',
              ],
             'psr/container' =>
              [
                  'pretty_version' => '1.1.1',
                  'version' => '1.1.1.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '8622567409010282b7aeebe4bb841fe98b58dcaf',
              ],
             'psr/http-message' =>
              [
                  'pretty_version' => '1.0.1',
                  'version' => '1.0.1.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => 'f6561bf28d520154e4b0ec72be95418abe6d9363',
              ],
             'psr/http-message-implementation' =>
              [
                  'provided' =>
                   [
                       0 => '1.0',
                   ],
              ],
             'psr/log-implementation' =>
              [
                  'provided' =>
                   [
                       0 => '1.0|2.0',
                   ],
              ],
             'react/cache' =>
              [
                  'pretty_version' => 'v1.1.1',
                  'version' => '1.1.1.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '4bf736a2cccec7298bdf745db77585966fc2ca7e',
              ],
             'react/dns' =>
              [
                  'pretty_version' => 'v1.9.0',
                  'version' => '1.9.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '6d38296756fa644e6cb1bfe95eff0f9a4ed6edcb',
              ],
             'react/event-loop' =>
              [
                  'pretty_version' => 'v1.2.0',
                  'version' => '1.2.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => 'be6dee480fc4692cec0504e65eb486e3be1aa6f2',
              ],
             'react/http' =>
              [
                  'pretty_version' => 'v1.6.0',
                  'version' => '1.6.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '59961cc4a5b14481728f07c591546be18fa3a5c7',
              ],
             'react/promise' =>
              [
                  'pretty_version' => 'v2.9.0',
                  'version' => '2.9.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '234f8fd1023c9158e2314fa9d7d0e6a83db42910',
              ],
             'react/promise-stream' =>
              [
                  'pretty_version' => 'v1.3.0',
                  'version' => '1.3.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '3ebd94fe0d8edbf44937948af28d02d5437e9949',
              ],
             'react/promise-timer' =>
              [
                  'pretty_version' => 'v1.8.0',
                  'version' => '1.8.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '0bbbcc79589e5bfdddba68a287f1cb805581a479',
              ],
             'react/socket' =>
              [
                  'pretty_version' => 'v1.11.0',
                  'version' => '1.11.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => 'f474156aaab4f09041144fa8b57c7d70aed32a1c',
              ],
             'react/stream' =>
              [
                  'pretty_version' => 'v1.2.0',
                  'version' => '1.2.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '7a423506ee1903e89f1e08ec5f0ed430ff784ae9',
              ],
             'ringcentral/psr7' =>
              [
                  'pretty_version' => '1.3.0',
                  'version' => '1.3.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '360faaec4b563958b673fb52bbe94e37f14bc686',
              ],
             'symfony/console' =>
              [
                  'pretty_version' => 'v5.4.17',
                  'version' => '5.4.17.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '58422fdcb0e715ed05b385f70d3e8b5ed4bbd45f',
              ],
             'symfony/deprecation-contracts' =>
              [
                  'pretty_version' => 'v2.5.0',
                  'version' => '2.5.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '6f981ee24cf69ee7ce9736146d1c57c2780598a8',
              ],
             'symfony/polyfill-ctype' =>
              [
                  'pretty_version' => 'v1.25.0',
                  'version' => '1.25.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '30885182c981ab175d4d034db0f6f469898070ab',
              ],
             'symfony/polyfill-intl-grapheme' =>
              [
                  'pretty_version' => 'v1.25.0',
                  'version' => '1.25.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '81b86b50cf841a64252b439e738e97f4a34e2783',
              ],
             'symfony/polyfill-intl-normalizer' =>
              [
                  'pretty_version' => 'v1.25.0',
                  'version' => '1.25.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '8590a5f561694770bdcd3f9b5c69dde6945028e8',
              ],
             'symfony/polyfill-mbstring' =>
              [
                  'pretty_version' => 'v1.25.0',
                  'version' => '1.25.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '0abb51d2f102e00a4eefcf46ba7fec406d245825',
              ],
             'symfony/polyfill-php73' =>
              [
                  'pretty_version' => 'v1.25.0',
                  'version' => '1.25.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => 'cc5db0e22b3cb4111010e48785a97f670b350ca5',
              ],
             'symfony/polyfill-php80' =>
              [
                  'pretty_version' => 'v1.25.0',
                  'version' => '1.25.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '4407588e0d3f1f52efb65fbe92babe41f37fe50c',
              ],
             'symfony/process' =>
              [
                  'pretty_version' => 'v5.4.5',
                  'version' => '5.4.5.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '95440409896f90a5f85db07a32b517ecec17fa4c',
              ],
             'symfony/service-contracts' =>
              [
                  'pretty_version' => 'v2.5.0',
                  'version' => '2.5.0.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '1ab11b933cd6bc5464b08e81e2c5b07dec58b0fc',
              ],
             'symfony/string' =>
              [
                  'pretty_version' => 'v5.4.3',
                  'version' => '5.4.3.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => '92043b7d8383e48104e411bc9434b260dbeb5a10',
              ],
             'symfony/yaml' =>
              [
                  'pretty_version' => 'v5.4.3',
                  'version' => '5.4.3.0',
                  'aliases' =>
                   [
                   ],
                  'reference' => 'e80f87d2c9495966768310fc531b487ce64237a2',
              ],
         ],
    ];







    public static function getInstalledPackages()
    {
        return array_keys(self::$installed['versions']);
    }









    public static function isInstalled($packageName)
    {
        return isset(self::$installed['versions'][$packageName]);
    }














    public static function satisfies(VersionParser $parser, $packageName, $constraint)
    {
        $constraint = $parser->parseConstraints($constraint);
        $provided = $parser->parseConstraints(self::getVersionRanges($packageName));

        return $provided->matches($constraint);
    }










    public static function getVersionRanges($packageName)
    {
        if (!isset(self::$installed['versions'][$packageName])) {
            throw new \OutOfBoundsException('Package "' . $packageName . '" is not installed');
        }

        $ranges = [];
        if (isset(self::$installed['versions'][$packageName]['pretty_version'])) {
            $ranges[] = self::$installed['versions'][$packageName]['pretty_version'];
        }
        if (array_key_exists('aliases', self::$installed['versions'][$packageName])) {
            $ranges = array_merge($ranges, self::$installed['versions'][$packageName]['aliases']);
        }
        if (array_key_exists('replaced', self::$installed['versions'][$packageName])) {
            $ranges = array_merge($ranges, self::$installed['versions'][$packageName]['replaced']);
        }
        if (array_key_exists('provided', self::$installed['versions'][$packageName])) {
            $ranges = array_merge($ranges, self::$installed['versions'][$packageName]['provided']);
        }

        return implode(' || ', $ranges);
    }





    public static function getVersion($packageName)
    {
        if (!isset(self::$installed['versions'][$packageName])) {
            throw new \OutOfBoundsException('Package "' . $packageName . '" is not installed');
        }

        if (!isset(self::$installed['versions'][$packageName]['version'])) {
            return null;
        }

        return self::$installed['versions'][$packageName]['version'];
    }





    public static function getPrettyVersion($packageName)
    {
        if (!isset(self::$installed['versions'][$packageName])) {
            throw new \OutOfBoundsException('Package "' . $packageName . '" is not installed');
        }

        if (!isset(self::$installed['versions'][$packageName]['pretty_version'])) {
            return null;
        }

        return self::$installed['versions'][$packageName]['pretty_version'];
    }





    public static function getReference($packageName)
    {
        if (!isset(self::$installed['versions'][$packageName])) {
            throw new \OutOfBoundsException('Package "' . $packageName . '" is not installed');
        }

        if (!isset(self::$installed['versions'][$packageName]['reference'])) {
            return null;
        }

        return self::$installed['versions'][$packageName]['reference'];
    }





    public static function getRootPackage()
    {
        return self::$installed['root'];
    }







    public static function getRawData()
    {
        return self::$installed;
    }



















    public static function reload($data)
    {
        self::$installed = $data;
    }
}
