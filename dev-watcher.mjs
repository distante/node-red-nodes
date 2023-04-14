// @ts-check
import { exec, execSync, spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { Subject, debounceTime, filter } from 'rxjs';

console.log('WATCHING');

const dockerContainerName = 'node-red-tester';

let docker = spawn('docker', ['compose', 'up'], { stdio: 'inherit' });

/**
 * @typedef {import('fs').WatchEventType} WatchEventType
 *
 * @typedef SubjectWatchEvent
 * @prop {WatchEventType} eventType
 * @prop {string} filename
 */

/** @type {Subject<SubjectWatchEvent>} */
const watchEvent$$ = new Subject();

const watcher = watch('nodes', { recursive: true }, (eventType, filename) => {
  watchEvent$$.next({ eventType, filename });
});

const watchSubscription = watchEvent$$
  .pipe(
    filter((watchEvent) => {
      const isTest = watchEvent.filename.includes('_spec.js');
      if (isTest) {
        console.debug('Ignoring test file change');
        return false;
      }
      return true;
    }),
    debounceTime(200)
  )
  .subscribe((watchEvent) => {
    console.log(watchEvent);

    console.log('Restarting Docker container');
    execSync(`docker stop ${dockerContainerName}`);
    docker = spawn('docker', ['compose', 'up'], { stdio: 'inherit' });
  });

process.on('SIGINT', () => {
  console.log('\nEXITING GRACEFULLY\n');
  watchEvent$$.complete();
  watchSubscription.unsubscribe();

  execSync(`docker stop ${dockerContainerName}`, { stdio: 'inherit' });

  watcher.close();
  docker.kill();

  console.log('\nBYE 👋!\n');
  process.exit(0);
});
