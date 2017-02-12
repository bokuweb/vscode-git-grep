'use strict';

import { exec } from 'child_process';
import { quote } from 'shell-quote';
import { window, commands, ExtensionContext, QuickPickItem, QuickPickOptions, workspace, Selection } from 'vscode';

const projectRoot = workspace.rootPath ? workspace.rootPath : '.';

export function activate(context: ExtensionContext) {

    (async () => {
        const disposable = commands.registerCommand('extension.gitGrep', async () => {
            const query = await window.showInputBox({ prompt: 'search...' })
            const command = quote(['git', 'grep', '-H', '-n', query]);

            exec(command, { cwd: projectRoot }, async (err, stdout, stderr) => {
                const lines = stdout.split(/\n/);
                console.log('err', err)
                if (err) {
                    console.log(stderr);
                    window.showErrorMessage(stderr);
                    return;
                }
                if (lines.length === 1 && lines[0] === '') {
                    window.showInformationMessage('There are no items')
                    return Promise.resolve();
                }
                const l = await window.showQuickPick(lines);
                const [file, line] = l.split(':');
                const doc = await workspace.openTextDocument(projectRoot + '/' + file);
                await window.showTextDocument(doc);
                const selection = new Selection(~~line, 0, ~~line, 0);
                window.activeTextEditor.selection = selection;
                commands.executeCommand('cursorUp');
                context.subscriptions.push(disposable);
            })
        });
    })().catch((error) => {
        window.showErrorMessage(error);
    });
}

export function deactivate() {
}