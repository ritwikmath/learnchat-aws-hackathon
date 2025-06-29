package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

var data chan string = make(chan string, 10)

type Payload struct {
	Message string `json:"message"`
}

func handleWebhook(w http.ResponseWriter, r *http.Request) {
	var payload Payload
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	select {
	case data <- payload.Message:
		log.Printf("Webhook received and message sent to channel: %s", payload.Message)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Message received successfully"})
	case <-time.After(5 * time.Second): // Optional: Add a timeout if the channel is consistently full
		log.Printf("Webhook message for '%s' timed out sending to channel", payload.Message)
		http.Error(w, "Service busy, try again later", http.StatusServiceUnavailable)
	}
}

func handleSseConnection(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	w.(http.Flusher).Flush()

	for {
		select {
		case <-r.Context().Done():
			log.Printf("Connection closed")
			return
		case msg := <-data:
			fmt.Fprintf(w, "data: %s\n\n", msg)
			w.(http.Flusher).Flush()
			log.Printf("SSE sent: %s", msg)
		}
	}
}

func main() {

	router := mux.NewRouter()

	router.HandleFunc("/sse", handleSseConnection).Methods("GET")

	router.HandleFunc("/webhook", handleWebhook).Methods("POST")

	http.ListenAndServe(":8000", router)
}
