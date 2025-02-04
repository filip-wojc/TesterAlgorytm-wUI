async function loadFitnessFunctions() {
    const functionSelect = document.getElementById('functionSelect');

    try {
        const response = await fetch('http://localhost:5236/api/algorithm/fitness-functions');
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
        const response = await fetch('http://localhost:5236/api/algorithm/algorithms');
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

    const selectedFunction = document.getElementById('functionSelect').value;
    if (!selectedFunction) {
        alert("Wybierz funkcję celu.");
        return;
    }

    const selectedAlgorithm = document.getElementById('algorithmSelect').value;
    if (!selectedAlgorithm) {
        alert("Wybierz algorytm.");
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

        // Wywołanie rozwiązania algorytmu
        const solveResponse = await fetch(`http://localhost:5236/api/algorithm/solve/${selectedFunction}/${selectedAlgorithm}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paramsInfo }),
        });

        if (!solveResponse.ok) {
            const solveError = await solveResponse.json();
            throw new Error(solveError.error || "Wystąpił błąd podczas rozwiązywania algorytmu.");
        }

        const solveResult = await solveResponse.json();
        const filePath = solveResult.filePath;

        // Pobranie PDF
        const pdfResponse = await fetch(`http://localhost:5236/api/algorithm/pdf-report?path=${encodeURIComponent(filePath)}`, {
            method: 'GET',
        });

        if (!pdfResponse.ok) {
            const pdfError = await pdfResponse.text();
            throw new Error(pdfError || "Wystąpił błąd podczas generowania PDF-a.");
        }

        const pdfBlob = await pdfResponse.blob();
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(pdfBlob);
        downloadLink.download = filePath;
        downloadLink.click();

        resultElement.innerText = "PDF został pobrany.";

        // Pobranie raportu tekstowego
        const txtResponse = await fetch(`http://localhost:5236/api/algorithm/text-report?path=${encodeURIComponent(filePath)}`, {
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
        resultElement.innerText = error.message;
    }
});


window.onload = loadFitnessFunctions;