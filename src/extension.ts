'use strict';

import { exec } from 'child_process';
import { quote } from 'shell-quote';
import { window, commands, ExtensionContext, QuickPickItem, QuickPickOptions, workspace, Selection } from 'vscode';

const projectRoot = workspace.rootPath ? workspace.rootPath : '.';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-git-grep" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = commands.registerCommand('extension.gitGrep', () => {
        // The code you place here will be executed every time your command is executed
        window.showInputBox({ prompt: 'search...' }).then((query) => {
            const command = quote(['git', 'grep', '-H', '-n', query]);
            exec(command, { cwd: projectRoot }, (err, stdout, stderr) => {
                const lines = stdout.split(/\n/);
                console.log(lines[0])
                window.showQuickPick(lines).then((l) => {
                    const [file, line] = l.split(':');
                    console.log(file)
                    workspace.openTextDocument(projectRoot + '/' + file).then(doc => {
                        console.log("openTextDocument success", doc.fileName);
                        window.showTextDocument(doc).then(() => {
                            const newSection = new Selection(~~line, 0, ~~line, 0);
                            window.activeTextEditor.selection = newSection;
                            commands.executeCommand('cursorUp');
                        });
                    });
                });
                context.subscriptions.push(disposable);
            });
        });
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}