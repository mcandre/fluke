let bandNamesToFrequencyBoundsKHz = {
             '80m': [    3500.0,    4000.0 ],
             '60m': [    5330.5,    5405.0 ],
             '40m': [    7000.0,    7300.0 ],
             '30m': [   10100.0,   10150.0 ],
             '20m': [   14000.0,   14350.0 ],
             '17m': [   18068.0,   18168.0 ],
             '15m': [   21000.0,   21450.0 ],
             '12m': [   24890.0,   24990.0 ],
             '10m': [   28000.0,   29700.0 ],
              '6m': [   50000.0,   54000.0 ],
    'Broadcast FM': [   87900.0,  107900.0 ],
              '2m': [  144000.0,  148000.0 ],
            'NOAA': [  162400.0,  162550.0 ],
           '1.25m': [  219000.0,  225000.0 ],
            '70cm': [  420000.0,  450000.0 ]
};

let
    maxWireLengthCM = 4000,
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
            halfWaveLowerCM = 14989622.9 / bandUpperBoundKHz,
            halfWaveUpperCM = 14989622.9 / bandLowerBoundKHz;
        let i = 1;

        while (true) {
            const halfWaveLowerBoundCM = Math.round(i * halfWaveLowerCM);

            if (halfWaveLowerBoundCM > maxWireLengthCM) {
                break;
            }

            const halfWaveUpperBoundCM = Math.min(
                Math.round(i * halfWaveUpperCM),
                maxWireLengthCM
            );

            for (let j = halfWaveUpperBoundCM; j >= halfWaveLowerBoundCM; j--) {
                m[j-1] = true;
            }

            i++;
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
                    label: 'Impedance',
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
