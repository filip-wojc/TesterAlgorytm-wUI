const apiProtocol = "https";
const apiPort = 7052;

function getFileNameWithoutExtension(path) {
    return path.substring(path.lastIndexOf('/')+1);
}

async function loadFitnessFunctions() {
    const functionSelect = document.getElementById('functionSelect');

    try {
        const response = await fetch(`${apiProtocol}://localhost:${apiPort}/api/algorithm/fitness-functions`);
        if (!response.ok) throw new Error("Nie udało się pobrać funkcji celu.");

        const functions = await response.json();
        functions.forEach(func => {
            const option = document.createElement('option');
            option.value = func;
            option.textContent = func;
            functionSelect.appendChild(option);
        });
    } catch (error) {
        alert(error.message);
    }


    const algorithmSelect = document.getElementById('algorithmSelect')

    try {
        const response = await fetch(`${apiProtocol}://localhost:${apiPort}/api/algorithm/algorithms`);
        if (!response.ok) throw new Error("Nie udało się pobrać algorytmów.");

        const functions = await response.json();
        functions.forEach(func => {
            const option = document.createElement('option');
            option.value = func;
            option.textContent = func;
            algorithmSelect.appendChild(option);
        });
    } catch (error) {
        alert(error.message);
    }
}


document.getElementById("algorithmSelect").addEventListener("change", function () {
    const selectedAlgorithm = this.value;
    const parameterCDiv = document.getElementById("parameterC");

    if (selectedAlgorithm === "Csa") {
        parameterCDiv.style.display = "block";
    } else {
        parameterCDiv.style.display = "none";
    }
});



document.getElementById('solveForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const resultElement = document.getElementById('result');
    resultElement.innerText = ""; 

    const selectedFunctions = document.getElementById('functionSelect').selectedOptions;
    if (!selectedFunctions || selectedFunctions.length <= 0) {
        alert("Wybierz co najmniej jedną funkcję celu.");
        return;
    }

    const selectedAlgorithms = document.getElementById('algorithmSelect').selectedOptions;
    if (!selectedAlgorithms || selectedAlgorithms.length <= 0) {
        alert("Wybierz co najmniej jeden algorytm.");
        return;
    }

    try {
        const paramsInfo = Array.from(document.querySelectorAll('.param')).map((paramDiv, index) => {
            const lowerBoundary = parseFloat(paramDiv.querySelector(`input[name="LowerBoundary${index}"]`).value);
            const upperBoundary = parseFloat(paramDiv.querySelector(`input[name="UpperBoundary${index}"]`).value);

            if (lowerBoundary > upperBoundary) {
                throw new Error(`Dolna granica musi być mniejsza od górnej dla parametru ${index + 1}`);
            }

            return {
                Name: `Param${index + 1}`,
                Description: "",
                LowerBoundary: lowerBoundary,
                UpperBoundary: upperBoundary,
                Step: parseFloat(paramDiv.querySelector(`input[name="Step${index}"]`).value),
            };
        });

        const functionNames = [];
        for(func of selectedFunctions) {
            functionNames.push(func.label);
        }

        const algorithmNames = [];
        for(algo of selectedAlgorithms) {
            algorithmNames.push(algo.label);
        }

        // Wywołanie rozwiązania algorytmu
        const solveResponse = await fetch(`${apiProtocol}://localhost:${apiPort}/api/algorithm/solve2`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paramsInfo,functionNames,algorithmNames })
        });

        if (!solveResponse.ok) {
            const errorText = await solveResponse.text();
            throw new Error(errorText || "Wystąpił błąd podczas rozwiązywania algorytmu.");
        }

        const solveResult = await solveResponse.json();
        const filePath = solveResult.filePath;

        // Pobranie PDF
        const pdfResponse = await fetch(`${apiProtocol}://localhost:${apiPort}/api/algorithm/pdf-report?path=${encodeURIComponent(filePath)}`, {
            method: 'GET',
        });

        if (!pdfResponse.ok) {
            const pdfError = await pdfResponse.text();
            throw new Error(pdfError || "Wystąpił błąd podczas generowania PDF-a.");
        }

        const pdfBlob = await pdfResponse.blob();
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(pdfBlob);
        downloadLink.download = getFileNameWithoutExtension(filePath).substring("AlgorithmStates_".length).replace(".txt",".pdf");
        downloadLink.click();

        resultElement.innerText = "PDF został pobrany.";

        // Pobranie raportu tekstowego
        const txtResponse = await fetch(`${apiProtocol}://localhost:${apiPort}/api/algorithm/text-report?path=${encodeURIComponent(filePath)}`, {
            method: 'GET',
        });
        
        if (!txtResponse.ok) {
            const errorText = await txtResponse.text();
            throw new Error(errorText || "Wystąpił błąd podczas pobierania raportu tekstowego.");
        }
        
        const textData = await txtResponse.text();
        
        const textReportElement = document.getElementById('textReport');
        textReportElement.innerText = textData;

    } catch (error) {
        resultElement.innerText = error;
    }
});


window.onload = loadFitnessFunctions;