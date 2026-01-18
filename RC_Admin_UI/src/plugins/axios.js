import axios from 'axios'

const axiosIns = axios.create({
// You can add your headers here
// ================================
// baseURL: '', // Let the stores handle the full paths
timeout: 10000,
// headers: {'X-Custom-Header': 'foobar'}
})


// ℹ️ Add request interceptor to send the authorization header on each subsequent request after login
axiosIns.interceptors.request.use(config => {
  // Retrieve token from localStorage
  const token = localStorage.getItem('accessToken')

  // If token is found
  if (token) {
    // Get request headers and if headers is undefined assign blank object
    config.headers = config.headers || {}

    // Set authorization header
    // Token is stored as {"access_token": "xxx"} object
    const parsedToken = JSON.parse(token)
    config.headers.Authorization = parsedToken?.access_token ? `Bearer ${parsedToken.access_token}` : ''
  }

  // Return modified config
  return config
})
export default axiosIns
