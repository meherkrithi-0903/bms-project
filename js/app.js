
let trueSoC = 100;
let KSoc = 100;
let OCVSoC = "";
let drift = 0;

let ccarr = [];
let kfarr = [];
let tarr = [];

let simulationRunning = false;
let soh = 100;
let temp = 25;

const ctx2 = document.getElementById("dischargeChart").getContext("2d");

const dischargeChart = new Chart(ctx2, {
    type: "line",
    data: {
        labels: [0,10,20,30,40,50,60,70,80,90,100],
        datasets: [
            {
                label: "LFP",
                data: [3.4,3.3,3.25,3.22,3.21,3.20,3.20,3.19,3.18,3.0,2.8],
                borderColor: "green",
                fill: false
            },
            {
                label: "NMC",
                data: [4.2,4.0,3.85,3.75,3.65,3.55,3.45,3.35,3.25,3.15,3.0],
                borderColor: "orange",
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});

const ctx = document.getElementById("myChart").getContext("2d");

const myChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: tarr,
        datasets: [
            {
                label: "Coulomb Counting",
                data: ccarr,
                borderColor: "red",
                fill: false
            },
            {
                label: "Kalman Filter",
                data: kfarr,
                borderColor: "blue",
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                min: 0,
                max: 100
            }
        }
    }
});

const batteryProfiles = {
    cyberster: {
        name: "MG Cyberster",
        capacity: 77,
        cells: 300,
        voltage: 3.2,
        maxTemp: 45,
        dischargerate: 2
    },
    iphone: {
        name: "iPhone 14",
        capacity: 0.0119,
        cells: 1,
        voltage: 3.7,
        maxTemp: 35,
        dischargerate: 0.05
    },
    custom: {
        name: "Custom",
        capacity: null,
        cells: null,
        voltage: null,
        maxTemp: 45,
        dischargerate: 2
    }
};

function updateBatteryIcon(soc) {
    const fill = document.getElementById("batteryFill");
    const label = document.getElementById("batteryLabel");

    const width = Math.max(0, (soc / 100) * 94);
    const color = soc > 50 ? "green" : soc > 20 ? "orange" : "red";

    fill.setAttribute("width", width);
    fill.setAttribute("fill", color);

    label.textContent = soc.toFixed(1) + "%";
    label.style.color = color;
}

function checkFault(ccValue, kfValue) {
    const banner = document.getElementById("faultBanner");
    const diff = Math.abs(ccValue - kfValue);

    if (temp > 45) {
        banner.style.display = "block";
        banner.style.background = "darkred";
        banner.textContent =
            "Thermal Warning - Battery Overheating: " +
            temp.toFixed(1) + " °C";
    } else if (diff > 2) {
        banner.style.display = "block";
        banner.style.background = "red";
        banner.textContent =
            "FAULT DETECTED - CC and KF have diverged!";
    } else {
        banner.style.display = "none";
    }
}

function startSimulation() {
    if (simulationRunning) return;

    simulationRunning = true;
    document.getElementById("startBtn").disabled = true;

    setInterval(function() {
        let capacity =
            parseFloat(document.getElementById("capacity").value) || 17.3;

        let cells =
            parseFloat(document.getElementById("numberofcells").value) || 72;

        drift += (Math.random() - 0.5) * 0.3;
        drift = Math.max(-5, Math.min(5, drift));

        let ccNoisy = trueSoC + drift + (Math.random() * 2);

        if (ccNoisy > 100) {
            ccNoisy = 100;
        }

        document.getElementById("cc").innerHTML =
            ccNoisy.toFixed(1) + "%";

        ccarr.push(ccNoisy);
        tarr.push(new Date().toLocaleTimeString());

        KSoc = KSoc * 0.7 + trueSoC * 0.3;

        document.getElementById("kf").innerHTML =
            KSoc.toFixed(1) + "%";

        updateBatteryIcon(KSoc);
        checkFault(ccNoisy, KSoc);

        kfarr.push(KSoc);
        myChart.update();

        if (trueSoC < 0) {
            trueSoC = 0;
        }

        if (KSoc < 0) {
            KSoc = 0;
        }

        soh -= 0.01;
        soh = Math.max(0, soh);

        const sohElement = document.getElementById("soh");
        sohElement.textContent = soh.toFixed(1) + "%";
        sohElement.style.color =
            soh > 80 ? "#27ae60" : soh > 50 ? "orange" : "red";

        temp += 0.1 + (Math.random() * 0.05);
        temp = Math.min(temp, 60);

        const tempElement = document.getElementById("temp");
        tempElement.textContent = temp.toFixed(1) + "°C";
        tempElement.style.color =
            temp < 35 ? "#27ae60" : temp < 45 ? "orange" : "red";

        const profile = batteryProfiles[currentProfile];
        const rate = profile.dischargerate || 2;

        trueSoC -= rate / (capacity * (soh / 100) + cells / 72);
        trueSoC = Math.max(0, trueSoC);

    }, 1000);
}

function carSleep() {
    document.getElementById("ocv").innerHTML =
        trueSoC.toFixed(1) + "%";
}

function carOn() {
    drift = 0;
    document.getElementById("ocv").innerHTML = "--";
}

function updateDischargeCurve() {
    let voltage =
        parseFloat(document.getElementById("voltagePerCell").value) || 3.2;

    let t = (voltage - 3.2) / (4.2 - 3.2);
    t = Math.max(0, Math.min(1, t));

    let lfp = [
        3.4, 3.3, 3.25, 3.22, 3.21,
        3.20, 3.20, 3.19, 3.18, 3.0, 2.8
    ];

    let nmc = [
        4.2, 4.0, 3.85, 3.75, 3.65,
        3.55, 3.45, 3.35, 3.25, 3.15, 3.0
    ];

    dischargeChart.data.datasets[0].data =
        lfp.map((v, i) => v + t * (nmc[i] - v));

    dischargeChart.update();
}

function resetsim() {
    trueSoC = 100;
    KSoc = 100;
    drift = 0;
    soh = 100;
    temp = 25;

    ccarr.length = 0;
    kfarr.length = 0;
    tarr.length = 0;

    myChart.update();

    simulationRunning = false;

    document.getElementById("startBtn").disabled = false;
    document.getElementById("cc").textContent = "--";
    document.getElementById("kf").textContent = "--";
    document.getElementById("ocv").textContent = "--";
    document.getElementById("soh").textContent = "100.0%";
    document.getElementById("temp").textContent = "25.0°C";

    updateBatteryIcon(100);

    document.getElementById("faultBanner").style.display = "none";
}

let currentProfile = "cyberster";

function selectProfile(profilekey) {
    currentProfile = profilekey;

    const profile = batteryProfiles[profilekey];

    if (profilekey !== "custom") {
        document.getElementById("capacity").value = profile.capacity;
        document.getElementById("voltagePerCell").value = profile.voltage;
        document.getElementById("numberofcells").value = profile.cells;

        updateDischargeCurve();
    }

    document.getElementById("profileTitle").textContent = profile.name;

    resetsim();

    if (profilekey === "iphone") {
        dischargeChart.data.datasets[0].hidden = true;
        document.querySelector("#dischargeChart").textContent =
            "NMC Discharge Curve - iPhone 14";
    } else {
        dischargeChart.data.datasets[0].hidden = false;
        document.querySelector("#dischargeChart").textContent =
            "LFP vs NMC Discharge Curve";
    }

    dischargeChart.update();
}

selectProfile("cyberster");
