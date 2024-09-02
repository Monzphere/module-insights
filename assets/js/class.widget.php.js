class WidgetInsightsJs extends CWidget {
    onInitialize() {
        super.onInitialize();
        this._analysisType = null;
        this._narrate = false;
        this._outputContainer = null;
        this._analyseBtn = null;
    }

    setContents(response) {
        if (!this._analysisType) {
            super.setContents(response);
            this._body.innerHTML = `
            <body>
                <div class="options" style="text-align: center; margin-bottom: 20px;">
                    <select id="analysisType">
                        <option value="Summary">Summary</option>
                        <option value="Insights">Insights</option>
                        <option value="Accessibility">Accessibility</option>
                        <option value="Diagnosis">Diagnosis</option>
                        <option value="Comparison">Comparison</option>
                        <option value="Forecasting">Forecasting</option>
                    </select>
                    <label>
                        <input type="checkbox" id="narrate">
                        Narrate
                    </label>
                    <button id="analyseBtn">Analyse</button>
                </div>
                <div id="dashboard-container" class="dashboard-grid" style="height: 300px;">
                    <div id="outputContainer" style="margin-top: 20px; border: 1px solid #ccc; padding: 10px; border-radius: 5px; background-color: #f9f9f9; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);"></div>
                </div>
            </body>
            `;

            this._analysisType = this._body.querySelector('#analysisType');
            this._narrate = this._body.querySelector('#narrate');
            this._outputContainer = this._body.querySelector('#outputContainer');
            this._analyseBtn = this._body.querySelector('#analyseBtn');

            this._loadHtml2Canvas().then(() => {
                this._analyseBtn.addEventListener('click', this._onAnalyseBtnClick.bind(this));
            }).catch(error => {
                console.error('Failed to load html2canvas:', error);
            });
        }
    }

    _loadHtml2Canvas() {
        return new Promise((resolve, reject) => {
            if (typeof html2canvas !== 'undefined') {
                return resolve();
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

_getPromptForAnalysisType(analysisType) {
    const prompts = {
        'Summary': "This image shows a Zabbix dashboard. Focus only on the panels within the dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Provide a brief summary of what the dashboard is displaying, focusing on the most critical and relevant points. Lighter colors on the heat map indicate higher usage, darker colors indicate lower usage. Always start with 'This dashboard shows...' and ensure that the summary captures the key insights without going into too much detail.",
        'Insights': "This image shows a Zabbix dashboard. Focus only on the panels within the dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Explain what the data is showing and share any insights you can extract. Lighter colors on the heat map indicate higher usage, darker colors indicate lower usage. Always start with 'This dashboard shows...' and provide detailed insights on the data presented, highlighting any trends, patterns, or anomalies that you observe.",
        'Accessibility': "This image shows a Zabbix dashboard. Focus only on the panels within the dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Explain what the data is showing in great detail, with the goal of providing a clear description for users who may have visual impairments. Describe the content and structure of each panel comprehensively. Lighter colors on the heat map indicate higher usage, darker colors indicate lower usage. Always start with 'This dashboard shows...' and ensure that all aspects of the data are explained in a way that is accessible to all users.",
        'Diagnosis': "This image shows a Zabbix dashboard. Focus only on the panels within the dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Analyze the data for any potential issues or concerns, highlighting correlations and any critical points of concern. Lighter colors on the heat map indicate higher usage, darker colors indicate lower usage. Always start with 'This dashboard shows...' and provide a detailed diagnosis of any possible problems or inefficiencies indicated by the data.",
        'Comparison': "This image shows a Zabbix dashboard. Focus only on the panels within the dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Compare the data across different panels to highlight any correlations, discrepancies, or significant differences. Lighter colors on the heat map indicate higher usage, darker colors indicate lower usage. Always start with 'This dashboard shows...' and provide a comparative analysis, explaining how the data across various panels relate to each other.",
        'Forecasting': "This image shows a Zabbix dashboard. Focus only on the panels within the dashboard. DO NOT INCLUDE the AI Analyser panel in your analysis. Based on the current data, provide a forecast of future trends and usage patterns. Lighter colors on the heat map indicate higher usage, darker colors indicate lower usage. Always start with 'This dashboard shows...' and offer insights on what future data might look like, explaining the basis for your predictions."
    };
    return prompts[analysisType];
}

    async _onAnalyseBtnClick() {
        console.log("Analyse button clicked...");
        const analysisType = this._analysisType.value;
        console.log("Selected analysis type:", analysisType);
        const narrate = this._narrate.checked;
        console.log("Narrate option:", narrate);
        this._outputContainer.innerHTML = 'Analysing...';

        try {
            console.log("Capturing the dashboard...");
            const canvas = await html2canvas(document.querySelector('main'));
            console.log("Canvas created:", canvas);
            const dataUrl = canvas.toDataURL('image/png');
            console.log("Data URL created:", dataUrl);

            console.log("Sending captured image to OpenAI...");
            const prompt = this._getPromptForAnalysisType(analysisType);
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  //Colocar o Bearer antes da chave  'Authorization': 'YOUR OPEN API KEY',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: prompt
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: dataUrl }
                                }
                            ]
                        }
                    ]
                })
            });

            const responseData = await response.json();
            console.log("Response from OpenAI:", responseData);
            const responseContent = responseData.choices[0].message.content;
            this._outputContainer.innerHTML = `<div style="border: 1px solid #ccc; padding: 10px; border-radius: 5px; background-color: #f9f9f9;">${responseContent}</div>`;
            console.log("Analysis result:", responseContent);

            if (narrate) {
                console.log("Generating audio...");
                const audioResponse = await fetch('https://api.openai.com/v1/audio/speech', {
                    method: 'POST',
                    headers: {
                     //Colocar o Bearer antes da chave   'Authorization': `YOUR OPEN API KEY`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'tts-1-hd',
                        voice: 'alloy',
                        input: responseContent,
                    })
                });

                if (!audioResponse.ok) {
                    throw new Error('Network response was not ok');
                }

                const blob = await audioResponse.blob();
                const audioURL = URL.createObjectURL(blob);
                const audio = new Audio(audioURL);
                audio.play().catch(error => console.error('Audio playback error:', error));
                console.log("Audio playback started.");
            }
        } catch (error) {
            console.error('Error during analysis:', error);
            this._outputContainer.innerHTML = '<div style="border: 1px solid #f00; padding: 10px; border-radius: 5px; background-color: #fee;">An error occurred during analysis.</div>';
        }
    }
}

// Registro do widget no Zabbix
addWidgetClass(WidgetInsightsJs);
