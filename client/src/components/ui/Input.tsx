import React from 'react';
type Props = React.InputHTMLAttributes<HTMLInputElement>;
export default function Input(props:Props){
  const style: React.CSSProperties = {
    padding:'10px 12px', borderRadius:'12px', border:'1px solid #234',
    background:'#0f2236', color:'var(--ink)', outline:'none'
  };
  return <input {...props} style={{...style, ...(props.style||{})}} />;
}
