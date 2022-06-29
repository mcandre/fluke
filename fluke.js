let bandNamesToFrequencyBoundsKHz = {
     '160m': [   1800.0,   2000.0 ],
      '80m': [   3500.0,   4000.0 ],
      '60m': [   5102.0,   5405.3 ],
      '40m': [   7000.0,   7300.0 ],
      '30m': [  10100.0,  10150.0 ],
      '20m': [  14000.0,  14350.0 ],
      '17m': [  18068.0,  18168.0 ],
      '15m': [  21000.0,  21450.0 ],
      '12m': [  24890.0,  24990.0 ],
      '10m': [  28000.0,  29700.0 ],
       '6m': [  50000.0,  54000.0 ],
       '2m': [ 144000.0, 148000.0 ],
    '1.25m': [ 222000.0, 225000.0 ],
     '70cm': [ 420000.0, 450000.0 ],
     '33cm': [ 902000.0, 928000.0 ]
};

let
    maxWireLengthCM = 3048,
    harmonics = 10,
    selectedBands = {},
    m = [],
    labels = [],
    data = [],
    c = null;

function generateData() {
    labels = [];
    m = [];

    for (let i = 1; i <= maxWireLengthCM; i++) {
        labels.push(i);
        m.push(0);
    }

    if (Object.keys(selectedBands) < 1) {
        return;
    }

    for (let band in selectedBands) {
        const [bandLowerBoundKHz, bandUpperBoundKHz] = selectedBands[band];

        for (let i = 1; i <= harmonics; i++) {
            const halfWaveLowerBoundKHz = Math.round(15000000 / (bandUpperBoundKHz * i));
            let halfWaveUpperBoundKHz = Math.round(15000000 / (bandLowerBoundKHz * i));

            if (halfWaveLowerBoundKHz <= maxWireLengthCM) {
                halfWaveUpperBoundKHz = Math.min(halfWaveUpperBoundKHz, maxWireLengthCM);

                for (let j = halfWaveUpperBoundKHz - 1; j >= halfWaveLowerBoundKHz; j--) {
                    m[j] = 1;
                }
            }
        }
    }
}

function plot() {
    generateData();

    if (c == null) {
        const ctx = document.getElementById('impedance-plot').getContext('2d');
        c = new Chart(ctx, {
            type: 'bar',
            options: {
                animation: false,
                scales: {
                    xAxes: {
                        title: {
                            display: true,
                            text: 'cm'
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 20
                        }
                    },
                    y: {
                        ticks: {
                            display: false
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {}
                }
            },
            data: {
                datasets: [{
                    label: 'High Impedance',
                    backgroundColor: [
                        pattern.draw('zigzag-horizontal', '#a29378')
                    ]
                }]
            }
        });
    }

    c.data.labels = labels;
    c.data.datasets[0].data = m;
    c.update();
}

const bandsElement = $('#bands');

for (let bandName in bandNamesToFrequencyBoundsKHz) {
    const
        childInput = $("<input type='checkbox' id='band-" + bandName + "' value='" + bandName + "' />"),childLabel = $("<label for='band-" + bandName + "'>" + bandName + '</label>'),
        childLineBreak = $('<br/>');
    bandsElement.append(childInput);
    bandsElement.append(childLabel);
    bandsElement.append(childLineBreak);
}

$("input[id|='band']").on('click', function() {
    const bandName = $(this).val();

    if ($(this).is(':checked')) {
        selectedBands[bandName] = bandNamesToFrequencyBoundsKHz[bandName];
    } else {
        delete selectedBands[bandName];
    }

    plot();
});

plot();
