import * as vscode from 'vscode';
import { getVSCodeDownloadUrl } from 'vscode-test/out/util';
const path = require('path');
let toggle = false;

export const setupExtension = () => {
  const nsPlus = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  );

  const nsMinus = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  );
  nsPlus.command = 'extension.generateMetrics';
  nsPlus.text = 'NS+';

  nsMinus.command = 'extension.stopListening';
  nsMinus.text = 'NS-';

  nsPlus.show();
  nsMinus.show();
};



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "Next Step" is now active!');
  setupExtension();

  const output = vscode.window.createOutputChannel('METRICS');
  // this is getting the application's root folder filepath string from its uri
  if (!vscode.workspace.workspaceFolders) {
    return;
  }

  const rootFolderURI = vscode.workspace.workspaceFolders[0].uri;
  const rootFolderPath = vscode.workspace.workspaceFolders[0].uri.path;

  // this gives us the fileName - we join the root folder URI with the file we are looking for, which is metrics.json
  const fileName = path.join(rootFolderPath, '/metrics.json');
  
  //create metrics.json file in the project rootFolder
  const wsEdit = new vscode.WorkspaceEdit();
  const newFileURI = vscode.Uri.file(rootFolderPath + '/metrics.json');
  const newFileCreate = wsEdit.createFile(newFileURI,{overwrite: true});
  console.log('new file created',newFileCreate);
  vscode.workspace.applyEdit(wsEdit);
  // console.log(newFile);

  const generateMetrics = vscode.commands.registerCommand(
    'extension.generateMetrics',
    async () => {
      console.log('Succesfully entered registerCommand');
      toggle = true;
      vscode.workspace.onDidChangeTextDocument(async (e) => {
        
        if (toggle) {
          console.log('Succesfully entered onDidChangeTextDocument');
        if (e.document.uri.path === fileName) {
          // name the command to be called on any file in the application
          // this parses our fileName to an URI - we need to do this for when we run openTextDocument below
          const fileUri = vscode.Uri.parse(fileName);
          console.log('found file', fileUri);
          // open the file at the Uri path and get the text
          const metricData = await vscode.workspace
            .openTextDocument(fileUri)
            .then((document) => {
              return document.getText();
            });
          const parsedMetricData = JSON.parse(metricData);
          const fcp = (parsedMetricData.metrics[0]['FCP'] / 1000).toFixed(2);
          const cls = parsedMetricData.metrics[0]['CLS'].toFixed(2);
          const lcp = (parsedMetricData.metrics[0]['LCP'] / 1000).toFixed(2);
          const fid = (parsedMetricData.metrics[0]['FID'] / 1000).toFixed(2);
          const hydration = (parsedMetricData.metrics[0]['Next.js-hydration'] / 1000).toFixed(2);
          const ttfb = (parsedMetricData.metrics[0]['TTFB'] / 1000).toFixed(2);
          const fcp_score = isNaN(Number(fcp)) ? '⚫️' : Number(fcp) < 1.8 ? 'Good 🟢' : Number(fcp) < 3 ? 'Moderate 🟠' : 'Poor 🔴';
          const cls_score = isNaN(Number(cls)) ? '⚫️' : Number(cls) < 0.1 ? 'Good 🟢' : Number(cls) < 0.25 ? 'Moderate 🟠' : 'Poor 🔴';
          const lcp_score = isNaN(Number(lcp)) ? '⚫️' : Number(lcp) < 2.5 ? 'Good 🟢' : Number(lcp) < 4 ? 'Moderate 🟠' : 'Poor 🔴';
          const fid_score = isNaN(Number(fid)) ? '⚫️' : Number(fid) < 1 ? 'Good 🟢' : Number(fid) < 3 ? 'Moderate 🟠' : 'Poor 🔴';
          const ttfb_score = isNaN(Number(ttfb)) ? '⚫️' : Number(ttfb) < 0.6 ? 'Good 🟢' : 'Poor 🔴';
          const fcp_link = 'https://web.dev/fcp/';
          const cls_link = 'https://web.dev/cls/';
          const lcp_link = 'https://web.dev/lcp/';
          const fid_link = 'https://web.dev/fid/';
          const ttfb_link = 'https://web.dev/time-to-first-byte/';
          const helpFixScore = `Want to improve "poor" areas?: ${fcp_score === 'Poor 🔴' ? fcp_link : ""} ${cls_score === 'Poor 🔴' ? cls_link : ""} ${fid_score === 'Poor 🔴' ? fid_link : ""} ${lcp_score === 'Poor 🔴' ? lcp_link : ""} ${ttfb_score === 'Poor 🔴' ? ttfb_link : ""}`;   
          const metricOutput = `       Value
FCP:   ${fcp + 's'}${' '.repeat(7 - fcp.length)}${fcp_score} 
CLS:   ${cls}${' '.repeat(8 - cls.length)}${cls_score}
LCP:   ${lcp + 's'}${' '.repeat(7 - lcp.length)}${lcp_score}
FID:   ${isNaN(Number(fid)) ? 'n/a' : fid + 's'}${' '.repeat(7 - fid.length)}${fid_score}
TTFB:  ${ttfb + 's'}${' '.repeat(7 - ttfb.length)}${ttfb_score}\n`;

          output.clear();
          output.show();
          output.appendLine(metricOutput);
          output.appendLine(helpFixScore);
        }
        
          // [[fcp_score, fcp_link], [cls_score, cls_link], [lcp_score, lcp_link], [fid_score, fid_link], [ttfb_score, ttfb_link]].filter( score => {
          //   return score[0] === 'Poor 🔴';
          // }).forEach(score => output.appendLine(score[1]))
        
      };
    }
  );
  const stopListening = vscode.commands.registerCommand(
    'extension.stopListening',
    async () => {
      toggle = false;
      output.clear();
      // write functionality to stop displaying Metrics
      console.log('Successfully entered extension.stopListening');
    }
  );
  context.subscriptions.push(generateMetrics, stopListening);
 });
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.log('entered deactivate block');
}
