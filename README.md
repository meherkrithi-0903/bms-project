# bms-project
An interactive, browser-based simulator that visualises how three core algorithms work together to estimate the State of Charge (SoC) of a battery pack in real time.

#What It Does: This project simulates the SoC estimation pipeline used in real-world BMS systems, including electric vehicles and consumer electronics.
Three algorithms run in parallel so you can compare their behaviour:
- Coulomb Counting: Integrates current over time to track charge. Susceptible to drift and noise over time.
- Open Circuit Voltage (OCV): Reads terminal voltage when the battery is at rest to infer SoC from a lookup curve.
- Kalman Filter: Fuses noisy Coulomb Counting data with a model prediction to produce a smoother, more accurate estimate.

#Features
- Three battery profiles — MG Cyberster (LFP, 77 kWh EV), iPhone 14 (NMC, 11.9 mAh), and a Custom mode
- Real-time SoC chart comparing Coulomb Counting vs Kalman Filter
- LFP vs NMC discharge curve visualisation with voltage-interpolated blending
- State of Health (SoH) degradation simulation over time
- Battery temperature simulation with thermal warning above 45°C
- Fault detection banner — triggers when CC and KF estimates diverge by more than 2%
- Visual battery icon with colour-coded SoC level
- Car Sleep / Car On controls to simulate OCV measurement windows

#Why does Coulomb Counting drift?
Small measurement errors in current accumulate over time. The simulator models this with a random drift term clamped between ±5%.

#What does the Kalman Filter do here?
It blends the noisy CC reading with the previous state estimate using a fixed gain (KSoc = KSoc * 0.7 + trueSoC * 0.3). In a production BMS this gain would be computed dynamically based on process and measurement noise covariances.

#What triggers the fault banner?
If the CC and KF estimates diverge by more than 2%, or the battery temperature exceeds 45°C, a fault alert is shown — mimicking how a real BMS raises diagnostic trouble codes (DTCs).



