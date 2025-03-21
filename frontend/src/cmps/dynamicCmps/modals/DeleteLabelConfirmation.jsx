import { useRef } from "react";


export function DeleteLabelConfirmation({ onDeleteLable, 
    toggleConfirmationModal, 
    confirmationRef, 
    animationActive, 
    labelName }) {

    return (
        <div className="delete-label-confirmation-background" onPointerDown={e => e.stopPropagation()}>
            <section 
            style={{visibility: animationActive ? 'hidden' : 'visible'}}
            className="delete-label-confirmation" 
            ref={confirmationRef}>
                <div className="upper-modal">
                    <button onClick={toggleConfirmationModal}>×</button>
                    <h4>{`Delete ${labelName} column?`}</h4>
                    <p>We'll keep it in your trash for 30 days, and then permanently delete it.</p>
                </div>

                <div className="lower-modal">
                    <button onClick={toggleConfirmationModal} className="cancel">Cancel</button>
                    <button onClick={onDeleteLable} className="delete">Delete</button>
                </div>
                
            </section>
        </div>
    )
}