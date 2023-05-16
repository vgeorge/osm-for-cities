variable "stack_name" {
  description = "Stack name"
  type        = string
  default     = "osm-for-cities"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  type = map(string)
  default = {
    Project = "Labs"
    Owner   = "Vito/Rub21"
    Client  = "osm-for-cities"
  }
}
