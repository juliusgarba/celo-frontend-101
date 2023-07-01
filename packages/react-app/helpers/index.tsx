import Blockies from 'react-blockies';

// Returns an identicon for the given address
export const identiconTemplate = (address : string) => {
    return <Blockies size={14} 
    scale={4} 
    className="identicon border-2 border-white rounded-full" // optional className
    seed={address} // seed used to generate icon data, default: random
    />
}
