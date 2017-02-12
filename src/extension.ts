'use strict';

import { exec } from 'child_process';
import { quote } from 'shell-quote';
import { window, commands, ExtensionContext, workspace, Selection } from 'vscode';

const projectRoot = workspace.rootPath ? workspace.rootPath : '.';

export function activate(context: ExtensionContext) {

    (async () => {
        const disposable = commands.registerCommand('extension.gitGrep', async () => {
            const query = await window.showInputBox({ prompt: 'Please input search word.' })
            const command = quote(['git', 'grep', '-H', '-n', query]);

            exec(command, { cwd: projectRoot }, async (err, stdout, stderr) => {
                if (stderr) {
                    window.showErrorMessage(stderr);
                    return Promise.resolve();
                }
                const lines = stdout.split(/\n/);
                if (lines.length === 1 && lines[0] === '') {
                    window.showInformationMessage('There are no items')
                    return Promise.resolve();
                }
                const [file, line] = (await window.showQuickPick(lines)).split(':');
                const doc = await workspace.openTextDocument(projectRoot + '/' + file);
                await window.showTextDocument(doc);
                window.activeTextEditor.selection = new Selection(~~line, 0, ~~line, 0);
                commands.executeCommand('cursorUp');
                context.subscriptions.push(disposable);
            });
        });
    })().catch((error) => {
        window.showErrorMessage(error);
    });
}

export function deactivate() {
}