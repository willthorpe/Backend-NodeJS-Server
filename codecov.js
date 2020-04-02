const shell = require('shelljs');

shell.exec(' bash <(curl -s https://codecov.io/bash) -t' + process.env.CODECOV_TOKEN);