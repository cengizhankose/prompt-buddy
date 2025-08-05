import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Prompt Buddy extension activated');

  // Register the command declared in package.json
  const disposable = vscode.commands.registerCommand(
    'promptBuddy.openPanel',
    () => {
      vscode.window.showInformationMessage('Hello from Prompt Buddy!');
    }
  );

  // Register completion provider for @ file suggestions in markdown files
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    { scheme: 'file', language: 'markdown' },
    {
      async provideCompletionItems(document, position) {
        const linePrefix = document
          .lineAt(position)
          .text.substring(0, position.character);

        // Only trigger if the last character typed was @
        if (!linePrefix.endsWith('@')) {
          return undefined;
        }

        const completionItems: vscode.CompletionItem[] = [];

        // Find all files in the workspace (excluding node_modules)
        const allFiles = await vscode.workspace.findFiles(
          '**/*',
          '**/node_modules/**'
        );
        const folders = new Set<string>();

        if (vscode.workspace.workspaceFolders) {
          const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
          const workspaceName = vscode.workspace.workspaceFolders[0].name;

          // Add workspace root as a folder suggestion
          const workspaceRootItem = new vscode.CompletionItem(
            workspaceName,
            vscode.CompletionItemKind.Folder
          );
          workspaceRootItem.detail = workspaceName;
          workspaceRootItem.insertText = '';
          workspaceRootItem.documentation = `Workspace root: ${workspaceName}`;
          completionItems.push(workspaceRootItem);

          for (const file of allFiles) {
            const relativePath = path.relative(workspaceRoot, file.fsPath);
            // Add file
            const item = new vscode.CompletionItem(
              relativePath,
              vscode.CompletionItemKind.File
            );
            item.detail = relativePath;
            item.insertText = relativePath;
            item.documentation = `File: ${relativePath}`;
            completionItems.push(item);

            // Add folder
            const dir = path.dirname(file.fsPath);
            const relativeDir = path.relative(workspaceRoot, dir);
            if (relativeDir && relativeDir !== '.') {
              folders.add(relativeDir);
            }
          }

          // Add folders to completion
          for (const folder of folders) {
            const item = new vscode.CompletionItem(
              folder,
              vscode.CompletionItemKind.Folder
            );
            item.detail = folder;
            item.insertText = folder;
            item.documentation = `Folder: ${folder}`;
            completionItems.push(item);
          }
        }

        return completionItems;
      },
    },
    '@' // Trigger on @ character
  );

  context.subscriptions.push(disposable, completionProvider);
}

/**
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  // Extension deactivation cleanup will go here
}
