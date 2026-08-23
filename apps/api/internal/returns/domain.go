package returns

import (
	"time"

	"github.com/google/uuid"
)

type ReturnReason string

const (
	ReasonDefective  ReturnReason = "defective"
	ReasonWrongItem  ReturnReason = "wrong_item"
	ReasonChangeMind ReturnReason = "change_of_mind"
)

type ReturnStatus string

const (
	ReturnStatusRequested ReturnStatus = "requested"
	ReturnStatusApproved  ReturnStatus = "approved"
	ReturnStatusRejected  ReturnStatus = "rejected"
	ReturnStatusCompleted ReturnStatus = "completed"
)

type ReturnRequest struct {
	ID          uuid.UUID    `json:"id"`
	OrderID     uuid.UUID    `json:"order_id"`
	OrderNumber string       `json:"order_number"`
	Reason      ReturnReason `json:"reason"`
	Description string       `json:"description"`
	Status      ReturnStatus `json:"status"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}
