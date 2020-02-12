import { Controller, Get, Post, Body } from '@nestjs/common';
import * as simplegit from 'simple-git/promise';
import { promisify } from 'util';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';
import * as Rimraf from 'rimraf';

const fsExists = promisify(fs.exists);
const tmpDir = promisify(tmp.dir);
const rimraf = promisify(Rimraf);
const readFile = promisify(fs.readFile);

@Controller()
export class RepositoryController {
  @Post('/repository')
  async runRepository(@Body() body: { url: string; branch?: string }) {
    const dir = await tmpDir();
    const git = simplegit();

    try {
      await git.clone(body.url, dir);

      await git.cwd(dir);

      if (!!body.branch) {
        await git.checkout(body.branch);
      }

      const configPath = path.join(dir, 'config.json');

      const configExists = await fsExists(configPath);

      if (!configExists) {
        await rimraf(dir);
        return { success: false, message: 'config.json does not exist' };
      }

      const configFile = await readFile(configPath, 'utf8');

      let config: any;

      try {
        config = JSON.parse(configFile);
      } catch (e) {
        await rimraf(dir);
        return { succes: false, message: 'config.json file is invalid JSON' };
      }

      return { success: true, config };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        message: 'something went wrong while cloing your repo',
      };
    } finally {
      await rimraf(dir);
    }
  }
}