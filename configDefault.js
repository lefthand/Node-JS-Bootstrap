exports.getSiteConfig = function () {
  configValues =  {
    url: 'http://localhost:3000',
    site_name: 'Node.JS Bootstrap',
    site_email: 'your email address',
    database_collection: 'bootstrap'
  }

  return configValues;
}

exports.getMailConfig = function () {
  configValues =  {
    host: 'smtp.gmail.com',
    username: 'yourGMAILaddress',
    password: 'yourGMAILpassword'
  }

  return configValues;
}
