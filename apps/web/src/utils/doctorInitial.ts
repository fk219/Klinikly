export const doctorInitial = (name: string) => {
  const displayName = name.replace(/^Dr\.\s*/i, '').trim();
  return (displayName.charAt(0) || 'D').toUpperCase();
};
