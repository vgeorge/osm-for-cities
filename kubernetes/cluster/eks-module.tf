
module "eks_blueprints" {
  source             = "github.com/aws-ia/terraform-aws-eks-blueprints?ref=v4.25.0"
  cluster_name       = "${var.stack_name}-cluster"
  cluster_version    = "1.25"
  enable_irsa        = true
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnets

  managed_node_groups = {
    role = {
      capacity_type   = "ON_DEMAND"
      node_group_name = "${var.stack_name}-nodes"
      instance_types  = ["t3.small"]
      desired_size    = "1"
      max_size        = "2"
      min_size        = "1"
    }
    # tags = merge(var.tags, {
    #   Name : "${var.stack_name}-node"
    # })
  }
  tags = var.tags
}

provider "kubernetes" {
  host                   = module.eks_blueprints.eks_cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks_blueprints.eks_cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    # This requires the awscli to be installed locally where Terraform is executed
    args = ["eks", "get-token", "--cluster-name", module.eks_blueprints.eks_cluster_id]
  }
}
