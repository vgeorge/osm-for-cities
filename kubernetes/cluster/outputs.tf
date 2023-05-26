output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks_blueprints.eks_cluster_endpoint
}

output "eks_cluster_status" {
  description = "Amazon EKS Cluster Status"
  value       = module.eks_blueprints.eks_cluster_status
}

output "eks_cluster_version" {
  description = "The Kubernetes version for the cluster"
  value       = module.eks_blueprints.eks_cluster_version
}

output "configure_kubectl" {
  description = "Configure kubectl: make sure you're logged in with the correct AWS profile and run the following command to update your kubeconfig"
  value       = module.eks_blueprints.configure_kubectl
}

output "region" {
  description = "AWS region"
  value       = var.region
}

output "efs_file_system_id" {
  description = "EFS file system id"
  value       = aws_efs_file_system.eks_filesystem.id
}

output "efs_dns_name" {
  description = "EFS dns name"
  value       = aws_efs_file_system.eks_filesystem.dns_name
}