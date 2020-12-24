'use strict';

import { exec } from 'child_process';
import { quote } from 'shell-quote';
import { window, commands, ExtensionContext, workspace, Selection, QuickPickItem, QuickPickOptions } from 'vscode';

interface QuickPickItemWithPath extends QuickPickItem {
    fullPath?: string;
}

const projectRoot = workspace.rootPath ? workspace.rootPath : '.';

export function activate(context: ExtensionContext) {
    (async () => {
        const disposable = commands.registerCommand('extension.gitGrep', async () => {
            // Get the current editor
            let wordText = ''
            let editor = window.activeTextEditor;
            if (editor) {
                // Get word under cursor position
                let wordRange = editor.document.getWordRangeAtPosition(editor.selection.start);
                if (!wordRange) {
                    wordText = '';
                }
                // Get word text
                wordText = editor.document.getText(wordRange);
            }

            const query = await window.showInputBox({ prompt: 'Please input search word.', value: wordText })
            const command = quote(['git', 'grep', '-H', '-n', '-e', query]);
            const fetchItems = (): Promise<QuickPickItemWithPath[]> => new Promise((resolve, reject) => {
                exec(command, { cwd: projectRoot, maxBuffer: 2000 * 1024 }, (err, stdout, stderr) => {
                    if (stderr) {
                        window.showErrorMessage(stderr);
                        return resolve([]);
                    }
                    const lines = stdout.split(/\n/).filter(l => l !== '');
                    if (!lines.length) {
                        window.showInformationMessage('There are no items.')
                        return resolve([]);
                    }
                    return resolve(lines.map(l => {
                        const [fullPath, line, ...desc] = l.split(':');
                        const path = fullPath.split('/');
                        return {
                            label: `${path[path.length - 1]} : ${line}`,
                            description: desc.join(':'),
                            detail: fullPath,
                            fullPath: l,
                        };
                    }));

                });
            });
            const options: QuickPickOptions = { matchOnDescription: true };
            const item = await window.showQuickPick(fetchItems(), options);
            if (!item) return;
            const [file, line] = item.fullPath.split(':');
            const doc = await workspace.openTextDocument(projectRoot + '/' + file);
            await window.showTextDocument(doc);
            window.activeTextEditor.selection = new Selection(~~line, 0, ~~line, 0);
            commands.executeCommand('cursorUp');
            context.subscriptions.push(disposable);
        });
    })().catch((error) => {
        window.showErrorMessage(error);
    });
}

export function deactivate() {
}
