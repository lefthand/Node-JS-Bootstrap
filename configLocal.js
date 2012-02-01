exports.getSiteConfig = function () {
  configValues =  {
    site_url: 'http://localhost:3000',
    site_name: 'Node.JS Bootstrap',
    site_email: 'lefthand@gmail.com',
    database_collection: 'bootstrap'
  }

  return configValues;
}

exports.getMailConfig = function () {
  configValues =  {
    host: 'smtp.gmail.com',
    username: 'lefthand@gmail.com',
    password: 'kiki((((((((((1GOOG'
  }

  return configValues;
}
