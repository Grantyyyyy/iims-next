// src/utils/api.js

import axios from 'axios'

export const fetchData = async (url, token) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching data:', error)
    throw error
  }
}

export const postData = async (url, data, token) => {
  try {
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Token ${token}`
      }
    })
    return response.data
  } catch (error) {
    console.error('Error posting data:', error)
    throw error
  }
}

export const updateData = async (url, data, token) => {
  const fullUrl = `http://localhost:8000${url}`; // Adjust this URL as needed
  const response = await fetch(fullUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}