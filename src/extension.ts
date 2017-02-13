'use strict';

import { exec } from 'child_process';
import { quote } from 'shell-quote';
import { window, commands, ExtensionContext, workspace, Selection, QuickPickItem, QuickPickOptions } from 'vscode';

interface QuickPickItemWithPath extends QuickPickItem {
    fullpath?: string;
}

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
                const lines = stdout.split(/\n/).filter(l => l !== '');
                const items: QuickPickItemWithPath[] = lines.map(l => {
                    const [fullPath, line, ...desc] = l.split(':');
                    const path = fullPath.split('/');
                    return {
                        label: `${path[path.length - 1]} : ${line}`,
                        description: desc.join(':'),
                        fullPath: l,
                    };
                });
                if (!lines.length) {
                    window.showInformationMessage('There are no items')
                    return Promise.resolve();
                }
                let item;
                try {
                    const options: QuickPickOptions = {
                        matchOnDescription: true,
                    }
                    item = await window.showQuickPick(items, options);
                } catch (e) {
                    window.showErrorMessage(e);
                }

                const [file, line] = item.fullPath.split(':');
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