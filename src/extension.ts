'use strict';

import * as vscode from 'vscode';
import MainController from './controllers/mainController';

let mainController: MainController;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    let activations: Promise<boolean>[] = [];

	// Start the main controller
	mainController = new MainController(context);
	context.subscriptions.push(mainController);
	activations.push(mainController.activate());

	return Promise.all(activations)
		.then((results: boolean[]) => {
			for (let result of results) {
				if (!result) {
					return false;
				}
			}
			return true;
		});
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (mainController) {
		mainController.deactivate();
	}
}