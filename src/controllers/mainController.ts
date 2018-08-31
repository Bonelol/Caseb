'use strict';

import * as vscode from 'vscode';
import * as _ from 'lodash';
import * as regex from './../regex/regex';

/**
 * The main controller class that initializes the extension
 */
export default class MainController implements vscode.Disposable {

	constructor(protected context: vscode.ExtensionContext) {

	}

	// PUBLIC METHODS //////////////////////////////////////////////////////
	public dispose(): void {
		this.deactivate();
	}

	/**
	 * Deactivates the extension
	 */
	public deactivate(): void {
	}

	public async activate(): Promise<boolean> {

        vscode.commands.registerCommand('extension.caseb.uppercase', () => {
            const editor = vscode.window.activeTextEditor as vscode.TextEditor;

            if(!editor){
                return;
            }

            const content = editor.document.getText();

            if(!content){
                return;
            }

            let quoted;
            let quotedArray = new Array<{start: number, end: number}>();
            let matchedArray = new Array<{start: number, end: number, matched: string}>();

            do {
                quoted = regex.string.quoted.exec(content);
                if (quoted) {
                    quotedArray.push({start:quoted.index, end: quoted.index + quoted[0].length - 1});
                }
            } while (quoted);

            [regex.keyword.other, 
                regex.keyword.dml,
                regex.keyword.luw,
                regex.keyword.order, 
                regex.keyword.alias]
                .forEach((regex)=> this.checkRegex(content, regex, quotedArray, matchedArray));

            let resultrray = new Array<{start: number, end: number, text: string}>();
            let sortedMatchedArray = matchedArray.sort((a,b)=>a.start - b.start);

            for (let i = 0; i < sortedMatchedArray.length; i++) {
                const element = sortedMatchedArray[i];
                
                if(i === 0){
                    if(element.start !== 0){
                        const start = 0, end = element.start - 1;
                        resultrray.push({start:start, end: end, text: content.substring(start, end + 1)});
                    }
                }else{
                    const previous = sortedMatchedArray[i-1];
                    const start = previous.end + 1, end = element.start - 1;
                    resultrray.push({start:start, end: end, text: content.substring(start, end + 1)});
                }
                
                resultrray.push({start:element.start, end: element.end, text: content.substring(element.start, element.end + 1).toUpperCase() });

                if(i === sortedMatchedArray.length - 1 && element.end !== content.length){
                    const start = element.end + 1, end = content.length - 1;
                    resultrray.push({start:start, end: end, text: content.substring(start, end + 1)});
                }
            }

            const resultContent = resultrray.map(r=>r.text).join('');
            console.log(resultContent);

            editor.edit(builder => {
                const document = editor.document;
                const lastLine = document.lineAt(document.lineCount - 1);
    
                const start = new vscode.Position(0, 0);
                const end = new vscode.Position(document.lineCount - 1, lastLine.text.length);
    
                builder.replace(new vscode.Range(start, end), resultContent);
            }); 
        });

		return Promise.resolve(true);
    }

    private checkRegex(content: string, 
        regex: RegExp, 
        quotedArray: Array<{start: number, end: number}>, 
        matchedArray: Array<{start: number, end: number, matched: string}>){
        let match;

        do {
            match = regex.exec(content);
            if (match) {
                let start = match.index;
                let end = (match.index + match[0].length - 1);

                if(quotedArray.some(a=>{ return a.start <= start && a.end >= end; })){
                    return;
                }

                const list = _.filter(matchedArray, (r)=> (r.start <= start && r.end >= start)
                || (r.start <= end && r.end >= end)
                || (r.start >= start && r.end <= end));

                if(list.length > 0){
                    start = _.min(list.map(l=>l.start).concat(start)) as number;
                    end = _.max(list.map(l=>l.end).concat(end)) as number;
                    _.pullAll(matchedArray, list);
                }
                
                matchedArray.push({start:start, end: end, matched: match[0]});
            }
        } while (match);
    }
}