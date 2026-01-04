import React from 'react';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'ghost'|'danger' };
export default function Button({variant='primary', style, ...rest}:Props){
  const base = {
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid #234',
    cursor: 'pointer' as const,
    transition: '.2s',
    background: variant==='primary' ? '#103252' : 'transparent',
    color: 'var(--ink)',
  }
  const styles = variant==='primary' ? base :
    variant==='danger' ? {...base, background:'#3a0f1a', borderColor:'#5a1a2a'} :
    {...base, background:'transparent'};
  return <button style={{...styles, ...style}} {...rest} />;
}
