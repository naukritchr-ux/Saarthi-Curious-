/**
 * Helper function to get actor information for audit logging
 * Reads user_id and user_name from localStorage
 */
export const getActorInfo = () => {
  const userId = localStorage.getItem('user_id') || localStorage.getItem('id');
  const userName = localStorage.getItem('user_name') || localStorage.getItem('name');
  
  return {
    actor_id: userId ? parseInt(userId) : null,
    actor_name: userName || null
  };
};

/**
 * Appends actor info as query parameters to a URL
 */
export const appendActorParams = (baseUrl) => {
  const { actor_id, actor_name } = getActorInfo();
  
  if (!actor_id && !actor_name) {
    return baseUrl;
  }
  
  const params = new URLSearchParams();
  if (actor_id) params.append('actor_id', actor_id.toString());
  if (actor_name) params.append('actor_name', actor_name);
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.toString()}`;
};
