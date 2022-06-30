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
       '6m': [  50000.0,  54000.0 ]
};

let
    maxWireLengthCM = 5000,
    harmonics = 40,
    selectedBands = {},
    m = [],
    labels = [],
    data = [],
    c = null;

function generateData() {
    labels = [];
    m = [];

    for (let i = 0; i < maxWireLengthCM; i++) {
        labels.push(i);
        m.push(false);
    }

    if (Object.keys(selectedBands) < 1) {
        return;
    }

    for (let band in selectedBands) {
        const
            [bandLowerBoundKHz, bandUpperBoundKHz] = selectedBands[band],
            quarterWaveLowerCM = 7494811.45 / bandLowerBoundKHz,
            halfWaveLowerCM = 14989622.9 / bandUpperBoundKHz,
            halfWaveUpperCM = 14989622.9 / bandLowerBoundKHz;

        for (let i = 1; i <= quarterWaveLowerCM; i++) {
            m[i-1] = true;
        }

        for (let i = 1; i <= harmonics; i+=2) {
            if (i % 4 == 0) {
                continue;
            }

            const halfWaveLowerBoundCM = Math.round(i * halfWaveLowerCM);
            let halfWaveUpperBoundCM = Math.round(i * halfWaveUpperCM);

            if (halfWaveLowerBoundCM > maxWireLengthCM) {
                break;
            }

            halfWaveUpperBoundCM = Math.min(halfWaveUpperBoundCM, maxWireLengthCM);

            for (let j = halfWaveUpperBoundCM; j >= halfWaveLowerBoundCM; j--) {
                m[j-1] = true;
            }
        }
    }
}

const chartAreaBorder = {
    id: 'chartAreaBorder',
    beforeDraw(chart, args, options) {
        const { ctx, chartArea: { left, top, width, height } } = chart;
        ctx.save();
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth;
        ctx.setLineDash(options.borderDash || []);
        ctx.lineDashOffset = options.borderDashOffset;
        ctx.strokeRect(left, top, width, height);
        ctx.restore();
    }
};

Chart.Tooltip.positioners.customPositioner = function(_elements, eventPosition) {
    return eventPosition;
};

function plot() {
    generateData();

    if (c == null) {
        const ctx = document.getElementById('impedance-plot').getContext('2d');

        c = new Chart(ctx, {
            type: 'line',
            plugins: [chartAreaBorder],
            options: {
                responsive: true,
                animation: false,
                fill: true,
                borderWidth: 0,
                elements: {
                    point:{
                        radius: 0
                    }
                },
                plugins: {
                    chartAreaBorder: {
                        borderColor: '#bbbbbb'
                    },
                    legend: {
                        labels: {
                            color: '#dddddd'
                        }
                    },
                    tooltip: {
                        intersect: false,
                        mode: 'index',
                        position: 'customPositioner',
                        callbacks: {
                            title: function(context) {
                                let x = 1 + context[0].dataIndex;
                                return x.toString().padStart(4, ' ') + ' cm';
                            },
                            label: function(context) {
                                let label = 'false';

                                if (context.parsed.y !== null && context.parsed.y) {
                                    label = 'true ';
                                }

                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'End Fed Antenna Element (cm)',
                            color: '#dddddd'
                        },
                        min: 0,
                        max: maxWireLengthCM,
                        ticks: {
                            callback: function(value, index, ticks) {
                                return value.toString().padStart(4, ' ');
                            },
                            stepSize: 1000,
                            color: '#dddddd'
                        },
                        grid: {
                            display: false
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

const bandsElement = $('#bands-list');

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
