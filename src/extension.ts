import * as vscode from 'vscode';
import * as si from 'systeminformation';

export function activate(context: vscode.ExtensionContext) {
    const openTerminalDisposable = vscode.commands.registerCommand('edex-ui.openTerminal', () => {
        const panel = vscode.window.createWebviewPanel(
            'edex-ui-terminal',
            'eDEX-UI Terminal',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        const terminal = vscode.window.createTerminal({ name: 'eDEX-UI Terminal' });

        terminal.onDidWrite(data => {
            panel.webview.postMessage({
                command: 'stdout',
                payload: data
            });
        });

        panel.webview.html = getTerminalWebviewContent();

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'stdin':
                        terminal.sendText(message.text, false);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    const openWidgetsDisposable = vscode.commands.registerCommand('edex-ui.openWidgets', () => {
        const panel = vscode.window.createWebviewPanel(
            'edex-ui-widgets',
            'eDEX-UI System Widgets',
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        setInterval(() => {
            si.currentLoad().then(load => {
                si.mem().then(mem => {
                    panel.webview.postMessage({
                        command: 'update',
                        payload: {
                            cpu: load.currentLoad,
                            mem: mem.active / mem.total * 100
                        }
                    });
                });
            });
        }, 1000);

        panel.webview.html = getWidgetsWebviewContent();
    });

    context.subscriptions.push(openTerminalDisposable, openWidgetsDisposable);
}

function getTerminalWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eDEX-UI Terminal</title>
    <style>
        body {
            background-color: #0D1117;
            color: #58A6FF;
            font-family: monospace;
            overflow: hidden;
        }

        .grid {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
                linear-gradient(to right, rgba(88, 166, 255, 0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(88, 166, 255, 0.2) 1px, transparent 1px);
            background-size: 20px 20px;
            animation: pulse 5s infinite;
        }

        @keyframes pulse {
            0% {
                opacity: 0.5;
            }
            50% {
                opacity: 1;
            }
            100% {
                opacity: 0.5;
            }
        }
    </style>
</head>
<body>
    <div class="grid"></div>
    <pre id="terminal-output"></pre>
    <input id="terminal-input" type="text" style="position: absolute; bottom: 0; width: 100%;" />

    <script>
        const vscode = acquireVsCodeApi();
        const input = document.getElementById('terminal-input');
        const output = document.getElementById('terminal-output');

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                vscode.postMessage({
                    command: 'stdin',
                    text: input.value + '\\n'
                });
                input.value = '';
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'stdout':
                    output.textContent += message.payload;
                    break;
            }
        });
    </script>
</body>
</html>`;
}

function getWidgetsWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eDEX-UI System Widgets</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h1>System Widgets</h1>
    <canvas id="cpuChart" width="400" height="100"></canvas>
    <canvas id="memChart" width="400" height="100"></canvas>

    <script>
        const cpuCtx = document.getElementById('cpuChart').getContext('2d');
        const memCtx = document.getElementById('memChart').getContext('2d');

        const cpuChart = new Chart(cpuCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CPU Usage',
                    data: [],
                    borderColor: 'rgba(88, 166, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        const memChart = new Chart(memCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Memory Usage',
                    data: [],
                    borderColor: 'rgba(255, 123, 114, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        let history = 0;
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'update':
                    const now = new Date();
                    const label = \`\${now.getHours()}:\${now.getMinutes()}:\${now.getSeconds()}\`;

                    cpuChart.data.labels.push(label);
                    cpuChart.data.datasets[0].data.push(message.payload.cpu);
                    if (cpuChart.data.labels.length > 20) {
                        cpuChart.data.labels.shift();
                        cpuChart.data.datasets[0].data.shift();
                    }
                    cpuChart.update();

                    memChart.data.labels.push(label);
                    memChart.data.datasets[0].data.push(message.payload.mem);
                    if (memChart.data.labels.length > 20) {
                        memChart.data.labels.shift();
                        memChart.data.datasets[0].data.shift();
                    }
                    memChart.update();
                    break;
            }
        });
    </script>
</body>
</html>`;
}

// this function is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
